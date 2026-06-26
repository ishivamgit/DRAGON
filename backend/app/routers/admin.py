import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.competition import Competition, CompetitionStatus
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User
from app.schemas.competition import CompetitionResponse
from app.schemas.registration import ParticipantResponse, WinnerEntry
from app.schemas.user import AdminUserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar_one() or 0

    total_registrations_result = await db.execute(select(func.count(Registration.id)))
    total_registrations = total_registrations_result.scalar_one() or 0

    # Competition counts by status
    comp_by_status_result = await db.execute(
        select(Competition.status, func.count(Competition.id)).group_by(Competition.status)
    )
    comp_by_status = {row[0].value: row[1] for row in comp_by_status_result.all()}

    # Total prize paid out
    prize_result = await db.execute(
        select(func.sum(Registration.prize_amount)).where(
            Registration.prize_paid == True,  # noqa: E712
            Registration.prize_amount.is_not(None),
        )
    )
    prize_distributed = prize_result.scalar_one() or 0

    return {
        "total_users": total_users,
        "total_competitions_by_status": comp_by_status,
        "total_registrations": total_registrations,
        "total_prize_pool_distributed": float(prize_distributed),
    }


@router.get("/competitions/{slug}/participants", response_model=List[ParticipantResponse])
async def admin_get_participants(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> List[ParticipantResponse]:
    comp_result = await db.execute(
        select(Competition).where(Competition.slug == slug)
    )
    competition = comp_result.scalar_one_or_none()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    reg_result = await db.execute(
        select(Registration, User)
        .join(User, Registration.user_id == User.id)
        .where(Registration.competition_id == competition.id)
        .order_by(Registration.placement.asc().nullsfirst(), Registration.registered_at.asc())
    )
    rows = reg_result.all()

    return [
        ParticipantResponse(
            id=reg.id,
            user_id=reg.user_id,
            competition_id=reg.competition_id,
            registered_at=reg.registered_at,
            status=reg.status,
            placement=reg.placement,
            prize_amount=reg.prize_amount,
            prize_paid=reg.prize_paid,
            username=user.username,
            display_name=user.display_name,
        )
        for reg, user in rows
    ]


@router.post("/competitions/{slug}/declare-winners", status_code=status.HTTP_200_OK)
async def declare_winners(
    slug: str,
    winners: List[WinnerEntry],
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    comp_result = await db.execute(
        select(Competition).where(Competition.slug == slug)
    )
    competition = comp_result.scalar_one_or_none()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    updated = []
    for winner in winners:
        reg_result = await db.execute(
            select(Registration).where(
                Registration.competition_id == competition.id,
                Registration.user_id == winner.user_id,
                Registration.status == RegistrationStatus.registered,
            )
        )
        registration = reg_result.scalar_one_or_none()
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Active registration not found for user {winner.user_id}",
            )
        registration.placement = winner.placement
        registration.prize_amount = winner.prize_amount
        db.add(registration)
        updated.append(str(winner.user_id))

    await db.flush()
    return {"updated_registrations": updated, "competition_slug": slug}


@router.patch("/competitions/{slug}/status", response_model=CompetitionResponse)
async def update_competition_status(
    slug: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> CompetitionResponse:
    new_status_raw = body.get("status")
    if not new_status_raw:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="status is required")

    try:
        new_status = CompetitionStatus(new_status_raw)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status: {new_status_raw}",
        )

    result = await db.execute(
        select(Competition)
        .options(selectinload(Competition.sponsor))
        .where(Competition.slug == slug)
    )
    competition = result.scalar_one_or_none()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    competition.status = new_status
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

    # Build response manually to avoid circular import
    from app.routers.competitions import _build_competition_response
    return await _build_competition_response(competition, db)


@router.get("/users", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        search_filter = User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    offset = (page - 1) * per_page
    query = query.order_by(User.created_at.desc()).offset(offset).limit(per_page)
    result = await db.execute(query)
    users = result.scalars().all()

    pages = math.ceil(total / per_page) if total > 0 else 1
    return {
        "items": [AdminUserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def admin_update_user(
    user_id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AdminUserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    allowed_fields = {"is_active", "is_admin", "is_verified"}
    for field, value in body.items():
        if field in allowed_fields:
            setattr(user, field, value)
    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return AdminUserResponse.model_validate(user)
