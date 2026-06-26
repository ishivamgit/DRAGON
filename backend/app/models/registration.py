import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class RegistrationStatus(str, enum.Enum):
    registered = "registered"
    withdrawn = "withdrawn"
    disqualified = "disqualified"


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    competition_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        Enum(RegistrationStatus, name="registrationstatus"),
        default=RegistrationStatus.registered,
        nullable=False,
    )
    placement: Mapped[int] = mapped_column(Integer, nullable=True)
    prize_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    prize_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="registrations")  # noqa: F821
    competition: Mapped["Competition"] = relationship(  # noqa: F821
        "Competition", back_populates="registrations"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "competition_id", name="uq_registration_user_competition"),
        Index("ix_registrations_user_id", "user_id"),
        Index("ix_registrations_competition_id", "competition_id"),
        Index("ix_registrations_status", "status"),
    )
