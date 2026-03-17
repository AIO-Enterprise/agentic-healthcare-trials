"""
M8: Advertisement Routes
Owner: Backend Dev 2
Dependencies: M1, M2, M5 (Curator), M6 (Reviewer)

Full advertisement lifecycle: create → curate → review → ethics → publish → optimize
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.db.database import get_db
from app.models.models import (
    User, UserRole, Advertisement, AdStatus, Review, CompanyDocument
)
from app.schemas.schemas import (
    AdvertisementCreate, AdvertisementOut, AdvertisementUpdate,
    ReviewCreate, ReviewOut, OptimizerDecision, BotConfigUpdate,
)
from app.core.security import require_roles, get_current_user
from app.services.ai.curator import CuratorService
from app.services.ai.reviewer import ReviewerService

router = APIRouter(prefix="/advertisements", tags=["Advertisements"])


# ─── CRUD ─────────────────────────────────────────────────────────────────────

@router.post("/", response_model=AdvertisementOut)
async def create_advertisement(
    body: AdvertisementCreate,
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PUBLISHER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new advertisement campaign.
    Options: Website, Ads, Voicebot*, Chatbot*
    """
    ad = Advertisement(
        company_id=user.company_id,
        title=body.title,
        ad_type=body.ad_type,
        budget=body.budget,
        platforms=body.platforms,
        target_audience=body.target_audience,
        status=AdStatus.DRAFT,
    )
    db.add(ad)
    await db.flush()
    return ad


@router.get("/", response_model=List[AdvertisementOut])
async def list_advertisements(
    status: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all advertisements for the user's company, optionally filtered by status."""
    query = select(Advertisement).where(Advertisement.company_id == user.company_id)
    if status:
        query = query.where(Advertisement.status == status)
    result = await db.execute(query.order_by(Advertisement.updated_at.desc()))
    return result.scalars().all()


@router.get("/{ad_id}", response_model=AdvertisementOut)
async def get_advertisement(
    ad_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Advertisement).where(
            Advertisement.id == ad_id,
            Advertisement.company_id == user.company_id,
        )
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    return ad


@router.patch("/{ad_id}", response_model=AdvertisementOut)
async def update_advertisement(
    ad_id: str,
    body: AdvertisementUpdate,
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PUBLISHER, UserRole.REVIEWER])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Advertisement).where(
            Advertisement.id == ad_id,
            Advertisement.company_id == user.company_id,
        )
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ad, field, value)
    return ad


# ─── AI Strategy Generation (Curator) ────────────────────────────────────────

@router.post("/{ad_id}/generate-strategy", response_model=AdvertisementOut)
async def generate_strategy(
    ad_id: str,
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PUBLISHER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger the Curator agent to generate a marketing strategy.
    Uses company documents + input docs as context.
    """
    result = await db.execute(
        select(Advertisement).where(
            Advertisement.id == ad_id,
            Advertisement.company_id == user.company_id,
        )
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")

    # Gather company documents for RAG context
    docs_result = await db.execute(
        select(CompanyDocument).where(CompanyDocument.company_id == user.company_id)
    )
    company_docs = docs_result.scalars().all()

    curator = CuratorService(db, user.company_id)
    strategy = await curator.generate_strategy(ad, company_docs)

    ad.strategy_json = strategy
    ad.status = AdStatus.STRATEGY_CREATED

    return ad


# ─── Review Workflow ──────────────────────────────────────────────────────────

@router.post("/{ad_id}/submit-for-review", response_model=AdvertisementOut)
async def submit_for_review(
    ad_id: str,
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PUBLISHER])),
    db: AsyncSession = Depends(get_db),
):
    """Move ad to reviewer queue. Reviewer AI pre-processes the strategy."""
    result = await db.execute(
        select(Advertisement).where(Advertisement.id == ad_id)
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")

    reviewer_svc = ReviewerService(db, user.company_id)
    review_output = await reviewer_svc.pre_review(ad)

    ad.website_reqs = review_output.get("website_requirements")
    ad.ad_details = review_output.get("ad_details")
    ad.status = AdStatus.UNDER_REVIEW

    return ad


@router.post("/{ad_id}/reviews", response_model=ReviewOut)
async def create_review(
    ad_id: str,
    body: ReviewCreate,
    user: User = Depends(require_roles([UserRole.REVIEWER, UserRole.ETHICS_REVIEWER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Human reviewer submits review with comments, suggestions, and optional edits.
    Ethics reviewers use review_type='ethics'.
    """
    review = Review(
        advertisement_id=ad_id,
        reviewer_id=user.id,
        review_type=body.review_type,
        status=body.status,
        comments=body.comments,
        suggestions=body.suggestions,
        edited_strategy=body.edited_strategy,
    )
    db.add(review)

    # Update ad status based on review type
    ad_result = await db.execute(select(Advertisement).where(Advertisement.id == ad_id))
    ad = ad_result.scalar_one_or_none()
    if ad and body.status == "approved":
        ad.status = AdStatus.APPROVED
    elif ad and body.review_type == "ethics":
        ad.status = AdStatus.ETHICS_REVIEW

    await db.flush()
    return review


@router.get("/{ad_id}/reviews", response_model=List[ReviewOut])
async def list_reviews(
    ad_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(Review.advertisement_id == ad_id)
    )
    return result.scalars().all()


# ─── Publishing ───────────────────────────────────────────────────────────────

@router.post("/{ad_id}/publish", response_model=AdvertisementOut)
async def publish_advertisement(
    ad_id: str,
    user: User = Depends(require_roles([UserRole.PUBLISHER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Publisher triggers creation + deployment of the approved strategy.
    Routes to Website Agent or Ad Agent based on ad_type.
    """
    result = await db.execute(
        select(Advertisement).where(
            Advertisement.id == ad_id,
            Advertisement.company_id == user.company_id,
        )
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    if ad.status != AdStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Advertisement must be approved before publishing")

    # TODO: Integrate with Website Development Agent / Ad Agent
    # For now, mark as published
    ad.status = AdStatus.PUBLISHED
    return ad


# ─── Bot Configuration (Voicebot/Chatbot) ────────────────────────────────────

@router.patch("/{ad_id}/bot-config", response_model=AdvertisementOut)
async def update_bot_config(
    ad_id: str,
    body: BotConfigUpdate,
    user: User = Depends(require_roles([UserRole.PUBLISHER])),
    db: AsyncSession = Depends(get_db),
):
    """Configure voicebot/chatbot parameters."""
    result = await db.execute(
        select(Advertisement).where(Advertisement.id == ad_id)
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")

    ad.bot_config = body.model_dump(exclude_unset=True)
    return ad
