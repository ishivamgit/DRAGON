"""Seed the database with an admin user, a demo user, and sample data.

Run from the backend directory:
    .venv\\Scripts\\python.exe seed.py

Safe to run multiple times — it skips records that already exist.

Default credentials:
    admin@dragon.gg / Admin@123   (admin)
    player@dragon.gg / Player@123 (regular user)
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from slugify import slugify
from sqlalchemy import select

from app.database import AsyncSessionLocal, Base, engine
from app.models import Competition, Registration, Sponsor, User  # noqa: F401
from app.models.competition import CompetitionStatus
from app.security import hash_password


async def get_or_create_user(db, *, username, email, password, is_admin=False):
    existing = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if existing:
        return existing, False
    user = User(
        id=uuid.uuid4(),
        username=username,
        email=email,
        password_hash=hash_password(password),
        display_name=username.capitalize(),
        country="India",
        is_admin=is_admin,
        is_verified=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    return user, True


async def get_or_create_sponsor(db, *, name, website, description):
    existing = (
        await db.execute(select(Sponsor).where(Sponsor.name == name))
    ).scalar_one_or_none()
    if existing:
        return existing, False
    sponsor = Sponsor(
        id=uuid.uuid4(),
        name=name,
        website=website,
        description=description,
        is_active=True,
    )
    db.add(sponsor)
    await db.flush()
    return sponsor, True


async def get_or_create_competition(db, *, admin, sponsor, **kwargs):
    slug = slugify(kwargs["title"])
    existing = (
        await db.execute(select(Competition).where(Competition.slug == slug))
    ).scalar_one_or_none()
    if existing:
        return existing, False
    comp = Competition(
        id=uuid.uuid4(),
        slug=slug,
        sponsor_id=sponsor.id if sponsor else None,
        created_by=admin.id,
        currency="USD",
        entry_fee=Decimal("0.00"),
        **kwargs,
    )
    db.add(comp)
    await db.flush()
    return comp, True


async def main() -> None:
    # Ensure tables exist (matches the app's dev startup behavior).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        admin, created = await get_or_create_user(
            db,
            username="admin",
            email="admin@dragon.gg",
            password="Admin@123",
            is_admin=True,
        )
        print(f"{'created' if created else 'exists '}  admin user: admin@dragon.gg / Admin@123")

        player, created = await get_or_create_user(
            db,
            username="player",
            email="player@dragon.gg",
            password="Player@123",
        )
        print(f"{'created' if created else 'exists '}  demo user:  player@dragon.gg / Player@123")

        nvidia, _ = await get_or_create_sponsor(
            db,
            name="NVIDIA",
            website="https://www.nvidia.com",
            description="Sponsoring the future of competitive gaming.",
        )
        redbull, _ = await get_or_create_sponsor(
            db,
            name="Red Bull",
            website="https://www.redbull.com",
            description="Gives your gameplay wings.",
        )

        now = datetime.now(timezone.utc)
        comps = [
            dict(
                title="NVIDIA Valorant Open 2026",
                description="A global Valorant tournament for the RTX generation.",
                game_name="Valorant",
                game_genre="Tactical FPS",
                prize_pool=Decimal("50000.00"),
                max_participants=128,
                status=CompetitionStatus.upcoming,
                start_date=now + timedelta(days=14),
                end_date=now + timedelta(days=16),
                registration_deadline=now + timedelta(days=10),
                rules="5v5 single elimination. BO3 finals.",
                sponsor=nvidia,
            ),
            dict(
                title="Red Bull Rocket League Cup",
                description="High-octane 3v3 Rocket League action.",
                game_name="Rocket League",
                game_genre="Sports",
                prize_pool=Decimal("20000.00"),
                max_participants=64,
                status=CompetitionStatus.active,
                start_date=now - timedelta(days=1),
                end_date=now + timedelta(days=2),
                registration_deadline=now - timedelta(days=2),
                rules="3v3 double elimination.",
                sponsor=redbull,
            ),
            dict(
                title="DRAGON Community Smash",
                description="Open-bracket community tournament. Everyone welcome.",
                game_name="Super Smash Bros Ultimate",
                game_genre="Fighting",
                prize_pool=Decimal("5000.00"),
                max_participants=256,
                status=CompetitionStatus.completed,
                start_date=now - timedelta(days=20),
                end_date=now - timedelta(days=18),
                registration_deadline=now - timedelta(days=22),
                rules="1v1 double elimination.",
                sponsor=None,
            ),
        ]

        for c in comps:
            sponsor = c.pop("sponsor")
            comp, created = await get_or_create_competition(
                db, admin=admin, sponsor=sponsor, **c
            )
            print(f"{'created' if created else 'exists '}  competition: {comp.title}")

        await db.commit()

    await engine.dispose()
    print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(main())
