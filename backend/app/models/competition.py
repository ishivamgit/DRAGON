import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class CompetitionStatus(str, enum.Enum):
    draft = "draft"
    upcoming = "upcoming"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class Competition(Base):
    __tablename__ = "competitions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(250), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    game_name: Mapped[str] = mapped_column(String(100), nullable=False)
    game_genre: Mapped[str] = mapped_column(String(100), nullable=True)
    sponsor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sponsors.id", ondelete="SET NULL"), nullable=True
    )
    prize_pool: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer, nullable=True)
    entry_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    status: Mapped[CompetitionStatus] = mapped_column(
        Enum(CompetitionStatus, name="competitionstatus"),
        default=CompetitionStatus.draft,
        nullable=False,
    )
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rules: Mapped[str] = mapped_column(Text, nullable=True)
    banner_url: Mapped[str] = mapped_column(String(512), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sponsor: Mapped["Sponsor"] = relationship("Sponsor", back_populates="competitions")  # noqa: F821
    creator: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="competitions_created", foreign_keys=[created_by]
    )
    registrations: Mapped[list["Registration"]] = relationship(  # noqa: F821
        "Registration", back_populates="competition", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_competitions_slug", "slug"),
        Index("ix_competitions_status", "status"),
        Index("ix_competitions_start_date", "start_date"),
        Index("ix_competitions_game_name", "game_name"),
    )
