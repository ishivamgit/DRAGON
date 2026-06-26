import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SponsorCreate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class SponsorUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SponsorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
