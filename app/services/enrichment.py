from typing import Optional

from app.schemas.ingest import LinkedInEnrichment


async def enrich_github(github_url: str) -> Optional[float]:
    """Stub GitHub enrichment - returns mock score"""
    return 75.0


async def enrich_linkedin(linkedin_url: str) -> Optional[LinkedInEnrichment]:
    """Stub LinkedIn enrichment - returns mock data"""
    return LinkedInEnrichment(
        skills_count=12,
        connections=500,
        profile_complete=True
    )
