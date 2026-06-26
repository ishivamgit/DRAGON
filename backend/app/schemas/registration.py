import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.registration import RegistrationStatus


class RegistrationCreate(BaseModel):
    competition_id: uuid.UUID


class RegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    competition_id: uuid.UUID
    registered_at: datetime
    status: RegistrationStatus
    placement: Optional[int] = None
    prize_amount: Optional[Decimal] = None
    prize_paid: bool


class WinnerEntry(BaseModel):
    user_id: uuid.UUID
    placement: int
    prize_amount: Optional[Decimal] = None


class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    competition_id: uuid.UUID
    registered_at: datetime
    status: RegistrationStatus
    placement: Optional[int] = None
    prize_amount: Optional[Decimal] = None
    prize_paid: bool
    username: Optional[str] = None
    display_name: Optional[str] = None
