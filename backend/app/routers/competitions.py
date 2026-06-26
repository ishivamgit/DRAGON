import json
import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from slugify import slugify
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.competition import Competition, CompetitionStatus
from app.models.registration import Registration, RegistrationStatus
from app.models.sponsor import Sponsor
from app.models.user import User
from app.redis_client import cache_delete_pattern, cache_get, cache_set
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionListResponse,
    CompetitionResponse,
    CompetitionUpdate,
)

router = APIRouter(prefix="/competitions", tags=["competitions"])

COMPETITIONS_CACHE_TTL = 60  # seconds
COMPETITION_DETAIL_TTL = 30  # seconds


async def _build_competition_response(
    competition: Competition, db: AsyncSession
) -> CompetitionResponse:
    # Count active participants
    count_result = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.competition_id == competition.id,
            Registration.status == RegistrationStatus.registered,
        )
    )
    participant_count = count_result.scalar_one() or 0

    sponsor_name = None
    if competition.sponsor:
        sponsor_name = competition.sponsor.name

    data = {
        "id": competition.id,
        "title": competition.title,
        "slug": competition.slug,
        "description": competition.description,
        "game_name": competition.game_name,
        "game_genre": competition.game_genre,
        "sponsor_id": competition.sponsor_id,
        "sponsor_name": sponsor_name,
        "prize_pool": competition.prize_pool,
        "currency": competition.currency,
        "max_participants": competition.max_participants,
        "entry_fee": competition.entry_fee,
        "status": competition.status,
        "start_date": competition.start_date,
        "end_date": competition.end_date,
        "registration_deadline": competition.registration_deadline,
        "rules": competition.rules,
        "banner_url": competition.banner_url,
        "current_participants": participant_count,
        "created_by": competition.created_by,
        "created_at": competition.created_at,
        "updated_at": competition.updated_at,
    }
    return CompetitionResponse(**data)


def _make_unique_slug(base_slug: str) -> str:
    return f"{base_slug}-{uuid.uuid4().hex[:6]}"


@router.get("", response_model=CompetitionListResponse)
async def list_competitions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[CompetitionStatus] = None,
    game_name: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> CompetitionListResponse:
    cache_key = f"competitions:list:{page}:{per_page}:{status}:{game_name}:{search}"
    cached = await cache_get(cache_key)
    if cached:
        return CompetitionListResponse(**cached)

    query = select(Competition).options(selectinload(Competition.sponsor))
    count_query = select(func.count(Competition.id))

    if status:
        query = query.where(Competition.status == status)
        count_query = count_query.where(Competition.status == status)
    if game_name:
        query = query.where(Competition.game_name.ilike(f"%{game_name}%"))
        count_query = count_query.where(Competition.game_name.ilike(f"%{game_name}%"))
    if search:
        search_filter = Competition.title.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    offset = (page - 1) * per_page
    query = query.order_by(Competition.created_at.desc()).offset(offset).limit(per_page)
    result = await db.execute(query)
    competitions = result.scalars().all()

    items = []
    for comp in competitions:
        resp = await _build_competition_response(comp, db)
        items.append(resp)

    pages = math.ceil(total / per_page) if total > 0 else 1
    response = CompetitionListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )

    await cache_set(
        cache_key,
        json.loads(response.model_dump_json()),
        COMPETITIONS_CACHE_TTL,
    )
    return response


@router.get("/{slug}", response_model=CompetitionResponse)
async def get_competition(slug: str, db: AsyncSession = Depends(get_db)) -> CompetitionResponse:
    cache_key = f"competitions:detail:{slug}"
    cached = await cache_get(cache_key)
    if cached:
        return CompetitionResponse(**cached)

    result = await db.execute(
        select(Competition)
        .options(selectinload(Competition.sponsor))
        .where(Competition.slug == slug)
    )
    competition = result.scalar_one_or_none()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    response = await _build_competition_response(competition, db)
    await cache_set(cache_key, json.loads(response.model_dump_json()), COMPETITION_DETAIL_TTL)
    return response


@router.post("", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_competition(
    body: CompetitionCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> CompetitionResponse:
    base_slug = slugify(body.title)
    slug = base_slug

    # Ensure slug uniqueness
    result = await db.execute(select(Competition).where(Competition.slug == slug))
    if result.scalar_one_or_none():
        slug = _make_unique_slug(base_slug)

    if body.sponsor_id:
        sponsor_result = await db.execute(
            select(Sponsor).where(Sponsor.id == body.sponsor_id, Sponsor.is_active == True)  # noqa: E712
        )
        if not sponsor_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sponsor not found or inactive",
            )

    competition = Competition(
        id=uuid.uuid4(),
        slug=slug,
        created_by=admin_user.id,
        **body.model_dump(exclude_unset=False),
    )
    db.add(competition)
    await db.flush()
    await db.refresh(competition)

    # Eager load sponsor
    result = await db.execute(
        select(Competition)
        .options(selectinload(Competition.sponsor))
        .where(Competition.id == competition.id)
    )
    competition = result.scalar_one()

    await cache_delete_pattern("competitions:list:*")
    return await _build_competition_response(competition, db)


@router.patch("/{slug}", response_model=CompetitionResponse)
async def update_competition(
    slug: str,
    body: CompetitionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> CompetitionResponse:
    result = await db.execute(
        select(Competition)
        .options(selectinload(Competition.sponsor))
        .where(Competition.slug == slug)
    )
    competition = result.scalar_one_or_none()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    update_data = body.model_dump(exclude_unset=True)

    if "title" in update_data:
        new_base_slug = slugify(update_data["title"])
        new_slug = new_base_slug
        dup = await db.execute(
            select(Competition).where(
                Competition.slug == new_slug, Competition.id != competition.id
            )
        )
        if dup.scalar_one_or_none():
            new_slug = _make_unique_slug(new_base_slug)
        update_data["slug"] = new_slug

    if "sponsor_id" in update_data and update_data["sponsor_id"] is not None:
        sponsor_result = await db.execute(
            select(Sponsor).where(
                Sponsor.id == update_data["sponsor_id"], Sponsor.is_active == True  # noqa: E712
            )
        )
        if not sponsor_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sponsor not found or inactive",
            )

    for field, value in update_data.items():
        setattr(competition, field, value)
    competition.updated_at = datetime.now(timezone.utc)
    db.add(competition)
    await db.flush()
    await db.refresh(competition)

    # Reload with sponsor
    result = await db.execute(
        select(Competition)
        .options(selectinload(Competition.sponsor))
        .where(Competition.id == competition.id)
    )
    competition = result.scalar_one()

    await cache_delete_pattern("competitions:list:*")
    await cache_delete_pattern(f"competitions:detail:{slug}")
    if competition.slug != slug:
        await cache_delete_pattern(f"competitions:detail:{competition.slug}")

    return await _build_competition_response(competition, db)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competition(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    result = await db.execute(select(Competition).where(Competition.slug == slug))
    competition = result.scalar_one_or_none()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    competition.status = CompetitionStatus.cancelled
    competition.updated_at = datetime.now(timezone.utc)
    db.add(competition)

    await cache_delete_pattern("competitions:list:*")
    await cache_delete_pattern(f"competitions:detail:{slug}")
