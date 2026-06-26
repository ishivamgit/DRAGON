import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.competition import CompetitionStatus


class CompetitionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    game_name: str
    game_genre: Optional[str] = None
    sponsor_id: Optional[uuid.UUID] = None
    prize_pool: Optional[Decimal] = None
    currency: str = "USD"
    max_participants: Optional[int] = None
    entry_fee: Decimal = Decimal("0.00")
    status: CompetitionStatus = CompetitionStatus.draft
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    rules: Optional[str] = None
    banner_url: Optional[str] = None


class CompetitionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    game_name: Optional[str] = None
    game_genre: Optional[str] = None
    sponsor_id: Optional[uuid.UUID] = None
    prize_pool: Optional[Decimal] = None
    currency: Optional[str] = None
    max_participants: Optional[int] = None
    entry_fee: Optional[Decimal] = None
    status: Optional[CompetitionStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    rules: Optional[str] = None
    banner_url: Optional[str] = None


class CompetitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    description: Optional[str] = None
    game_name: str
    game_genre: Optional[str] = None
    sponsor_id: Optional[uuid.UUID] = None
    sponsor_name: Optional[str] = None
    prize_pool: Optional[Decimal] = None
    currency: str
    max_participants: Optional[int] = None
    entry_fee: Decimal
    status: CompetitionStatus
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    rules: Optional[str] = None
    banner_url: Optional[str] = None
    current_participants: int = 0
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


class CompetitionListResponse(BaseModel):
    items: List[CompetitionResponse]
    total: int
    page: int
    per_page: int
    pages: int
