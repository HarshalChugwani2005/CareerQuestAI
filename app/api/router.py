from fastapi import APIRouter

from app.api.routes import auth, health, ingest, irr, lenders, loans, ml, students

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(students.router, tags=["students"])
api_router.include_router(loans.router, tags=["loans"])
api_router.include_router(lenders.router, tags=["lenders"])
api_router.include_router(ml.router, tags=["ml"])
api_router.include_router(irr.router, tags=["irr"])
api_router.include_router(ingest.router, tags=["ingest"])
# api_router.include_router(lti.router, tags=["lti"])  # temporarily disabled
