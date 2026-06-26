import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.sponsor import Sponsor
from app.models.user import User
from app.schemas.sponsor import SponsorCreate, SponsorResponse, SponsorUpdate

router = APIRouter(prefix="/sponsors", tags=["sponsors"])


@router.get("", response_model=List[SponsorResponse])
async def list_sponsors(db: AsyncSession = Depends(get_db)) -> List[SponsorResponse]:
    result = await db.execute(
        select(Sponsor).where(Sponsor.is_active == True).order_by(Sponsor.name)  # noqa: E712
    )
    sponsors = result.scalars().all()
    return [SponsorResponse.model_validate(s) for s in sponsors]


@router.get("/{sponsor_id}", response_model=SponsorResponse)
async def get_sponsor(sponsor_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> SponsorResponse:
    result = await db.execute(select(Sponsor).where(Sponsor.id == sponsor_id))
    sponsor = result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sponsor not found")
    return SponsorResponse.model_validate(sponsor)


@router.post("", response_model=SponsorResponse, status_code=status.HTTP_201_CREATED)
async def create_sponsor(
    body: SponsorCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> SponsorResponse:
    result = await db.execute(select(Sponsor).where(Sponsor.name == body.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sponsor with this name already exists",
        )
    sponsor = Sponsor(
        id=uuid.uuid4(),
        name=body.name,
        logo_url=body.logo_url,
        website=body.website,
        description=body.description,
    )
    db.add(sponsor)
    await db.flush()
    await db.refresh(sponsor)
    return SponsorResponse.model_validate(sponsor)


@router.patch("/{sponsor_id}", response_model=SponsorResponse)
async def update_sponsor(
    sponsor_id: uuid.UUID,
    body: SponsorUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> SponsorResponse:
    result = await db.execute(select(Sponsor).where(Sponsor.id == sponsor_id))
    sponsor = result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sponsor not found")

    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != sponsor.name:
        dup = await db.execute(select(Sponsor).where(Sponsor.name == update_data["name"]))
        if dup.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sponsor with this name already exists",
            )
    for field, value in update_data.items():
        setattr(sponsor, field, value)
    sponsor.updated_at = datetime.now(timezone.utc)
    db.add(sponsor)
    await db.flush()
    await db.refresh(sponsor)
    return SponsorResponse.model_validate(sponsor)


@router.delete("/{sponsor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sponsor(
    sponsor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    result = await db.execute(select(Sponsor).where(Sponsor.id == sponsor_id))
    sponsor = result.scalar_one_or_none()
    if not sponsor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sponsor not found")
    sponsor.is_active = False
    sponsor.updated_at = datetime.now(timezone.utc)
    db.add(sponsor)
