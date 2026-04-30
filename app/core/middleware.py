from typing import Callable

from jose import JWTError, jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import get_settings

class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        settings = get_settings()

        # Use prefix matching so sub-paths (e.g. /auth/register) are also exempt
        path = request.url.path
        if any(path.startswith(exempt) for exempt in settings.jwt_exempt_paths):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

        token = auth_header.replace("Bearer ", "", 1)
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
                audience=settings.jwt_audience,
                issuer=settings.jwt_issuer
            )
        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        request.state.user = payload
        return await call_next(request)
