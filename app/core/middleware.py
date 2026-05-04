from typing import Callable

from jose import JWTError, jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import get_settings

class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        settings = get_settings()
        path = request.url.path

        # 1. Always allow OPTIONS requests for CORS preflight
        if request.method == "OPTIONS":
            return await call_next(request)

        # 2. Check for exempt paths
        # We check for exact match for "/" and prefix match for others
        is_exempt = False
        for exempt in settings.jwt_exempt_paths:
            if exempt == "/":
                if path == "/" or path == "":
                    is_exempt = True
                    break
            elif path.startswith(exempt):
                is_exempt = True
                break

        if is_exempt:
            return await call_next(request)

        # 3. Require Authorization header for all other paths
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401, 
                content={"detail": "Unauthorized", "path": path}
            )

        token = auth_header.replace("Bearer ", "", 1)
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
                audience=settings.jwt_audience,
                issuer=settings.jwt_issuer
            )
            if payload.get("type") != "access":
                return JSONResponse(status_code=401, content={"detail": "Invalid token"})
            request.state.user = payload
        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        return await call_next(request)
