import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.competition import Competition, CompetitionStatus
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User
from app.schemas.registration import ParticipantResponse, RegistrationCreate, RegistrationResponse

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.post("", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_for_competition(
    body: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistrationResponse:
    # Fetch competition
    result = await db.execute(
        select(Competition).where(Competition.id == body.competition_id)
    )
    competition = result.scalar_one_or_none()
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    # Check competition is open for registration
    if competition.status not in (CompetitionStatus.upcoming, CompetitionStatus.active):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Competition is not open for registration",
        )

    # Check registration deadline
    if competition.registration_deadline:
        now = datetime.now(timezone.utc)
        deadline = competition.registration_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if now > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration deadline has passed",
            )

    # Check if user already registered
    dup_result = await db.execute(
        select(Registration).where(
            Registration.user_id == current_user.id,
            Registration.competition_id == body.competition_id,
        )
    )
    existing = dup_result.scalar_one_or_none()
    if existing:
        if existing.status == RegistrationStatus.withdrawn:
            # Allow re-registration
            existing.status = RegistrationStatus.registered
            existing.registered_at = datetime.now(timezone.utc)
            db.add(existing)
            await db.flush()
            await db.refresh(existing)
            return RegistrationResponse.model_validate(existing)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already registered for this competition",
        )

    # Check max participants
    if competition.max_participants is not None:
        count_result = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.competition_id == body.competition_id,
                Registration.status == RegistrationStatus.registered,
            )
        )
        current_count = count_result.scalar_one() or 0
        if current_count >= competition.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Competition is full",
            )

    registration = Registration(
        id=uuid.uuid4(),
        user_id=current_user.id,
        competition_id=body.competition_id,
    )
    db.add(registration)
    await db.flush()
    await db.refresh(registration)
    return RegistrationResponse.model_validate(registration)


@router.delete("/{competition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_registration(
    competition_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    # Fetch registration
    result = await db.execute(
        select(Registration).where(
            Registration.user_id == current_user.id,
            Registration.competition_id == competition_id,
        )
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found"
        )
    if registration.status != RegistrationStatus.registered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is not active",
        )

    # Fetch competition to check if started
    comp_result = await db.execute(
        select(Competition).where(Competition.id == competition_id)
    )
    competition = comp_result.scalar_one_or_none()
    if competition and competition.status == CompetitionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw from an active competition",
        )

    registration.status = RegistrationStatus.withdrawn
    db.add(registration)


@router.get("/{competition_id}/participants")
async def get_participants(
    competition_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify competition exists
    comp_result = await db.execute(
        select(Competition).where(Competition.id == competition_id)
    )
    competition = comp_result.scalar_one_or_none()
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found"
        )

    # Count registered participants
    count_result = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.competition_id == competition_id,
            Registration.status == RegistrationStatus.registered,
        )
    )
    count = count_result.scalar_one() or 0

    if not current_user.is_admin:
        return {"competition_id": str(competition_id), "participant_count": count}

    # Admin: return full participant list
    reg_result = await db.execute(
        select(Registration, User)
        .join(User, Registration.user_id == User.id)
        .where(Registration.competition_id == competition_id)
        .order_by(Registration.registered_at)
    )
    rows = reg_result.all()

    participants = []
    for reg, user in rows:
        participants.append(
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
        )
    return participants
