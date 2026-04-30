from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.middleware import JWTAuthMiddleware
from app.core.exceptions import unhandled_exception_handler

settings = get_settings()

app = FastAPI(title="RAVi by CareerQuest AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTAuthMiddleware)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(api_router)

@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
