# DRAGON — Gaming Competition Platform

## What This App Does
DRAGON is a web platform for gamers to sign up, browse sponsored gaming competitions, participate, and receive prize money from sponsor-funded tournaments (e.g., NVIDIA-sponsored competitions). Admins manage competitions, sponsors, users, and declare winners.

## Project Status
- **Environment**: Local development only (no cloud deployment yet)
- **GitHub**: https://github.com/ishivamgit/DRAGON
- **Docker is NOT used locally** (blocked by Accenture policy) — local dev runs on SQLite + an in-memory cache. The Docker/Postgres/Redis path is kept intact for production.

## Tech Stack

| Layer | Production | Local Dev (no Docker) |
|---|---|---|
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2 async | same |
| Database | PostgreSQL (asyncpg) | SQLite (aiosqlite) — `backend/dragon.db` |
| Cache / tokens | Redis | in-memory fallback (`USE_REDIS=false`) |
| Frontend | React 18 + Vite + Tailwind | same |
| Auth | JWT access (15m) + refresh (7d) | same |

The backend chooses SQLite vs Postgres from `DATABASE_URL`, and Redis vs in-memory from `USE_REDIS` (see `backend/app/config.py`).

## Local Ports (IMPORTANT)
Another local app (ClientStories) occupies **8000** and **5173**, so DRAGON uses:
- **Backend API**: http://127.0.0.1:**8010**
- **Frontend**: http://localhost:**5174** (pinned via `strictPort` in `vite.config.js`)
- Vite proxies `/api/*` → `http://localhost:8010`

## Project Structure

```
dragon/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, rate limiting, lifespan
│   │   ├── config.py            # Settings (DATABASE_URL, USE_REDIS, JWT, ...)
│   │   ├── database.py          # Async engine (SQLite or Postgres), get_db
│   │   ├── redis_client.py      # Redis OR in-memory cache fallback (same API)
│   │   ├── security.py          # bcrypt hashing (direct, not passlib) + JWT
│   │   ├── dependencies.py      # get_current_user, require_admin
│   │   ├── models/              # User, Sponsor, Competition, Registration
│   │   ├── schemas/             # Pydantic v2 request/response models
│   │   └── routers/             # auth, users, competitions, registrations, sponsors, admin
│   ├── alembic/                 # Migrations (for Postgres/production)
│   ├── requirements.txt         # Production deps (Postgres + Redis)
│   ├── requirements-local.txt   # Local deps (SQLite, no Redis, no asyncpg)
│   ├── seed.py                  # Seeds admin + demo user + sample data
│   └── .venv/                   # Local virtualenv (gitignored)
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client + per-resource API modules
│   │   ├── store/authStore.js   # Zustand auth state (persisted to localStorage)
│   │   ├── components/          # Navbar, CompetitionCard, StatusBadge, guards, ...
│   │   └── pages/               # Home, Login, Register, Competitions, Detail, Profile, admin/*
│   ├── vite.config.js           # Port 5174, /api proxy → 8010
│   └── Dockerfile + nginx.conf  # Production frontend image
├── docker-compose.yml           # Production stack (Postgres + Redis + backend + frontend)
└── README.md
```

## Data Models
- **User**: id (UUID), username, email, password_hash, display_name, avatar_url, bio, country, is_admin, is_verified, is_active, timestamps
- **Sponsor**: id, name, logo_url, website, description, is_active, timestamps
- **Competition**: id, title, slug (auto), description, game_name, game_genre, sponsor_id (FK), prize_pool, currency, max_participants, entry_fee, status (draft/upcoming/active/completed/cancelled), start/end/registration_deadline, rules, banner_url, created_by (FK), timestamps
- **Registration**: id, user_id (FK), competition_id (FK), registered_at, status (registered/withdrawn/disqualified), placement, prize_amount, prize_paid — UNIQUE(user_id, competition_id)

> UUID columns use SQLAlchemy's portable `Uuid` type (native UUID on Postgres, CHAR(32) on SQLite). When comparing a JWT `sub` (string) to a UUID column, cast with `uuid.UUID(...)` first — SQLite's bind processor requires a real UUID instance.

## Running Locally (no Docker)

**One-time setup:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-local.txt
.venv\Scripts\python.exe seed.py        # creates dragon.db + sample data
cd ../frontend
npm install
```

**Run (two terminals):**
```bash
# Terminal 1 — backend
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```
Then open http://localhost:5174. API docs at http://127.0.0.1:8010/docs.

Or just run `start-local.bat` from the repo root.

## Seed Credentials (local sample data)
- **Admin**: `admin@dragon.gg` / `Admin@123`
- **Player**: `player@dragon.gg` / `Player@123`

> Note: the `email-validator` library rejects reserved TLDs like `.local`, so seed emails use `.gg`.

## Running in Production (Docker)
```bash
cp .env.example .env   # set SECRET_KEY, DATABASE_URL (Postgres), USE_REDIS=true
docker compose up --build
```

## Key Decisions & Architecture Notes
- **SQLite + in-memory fallback for local dev** — chosen because Docker is policy-blocked; no DB/Redis install needed. Same code runs on Postgres + Redis in production via env vars.
- **bcrypt used directly** (not passlib) — passlib 1.7.x is incompatible with bcrypt 5.x on Python 3.14.
- **Portable `Uuid` column type** — one model definition works on both SQLite and Postgres.
- **JWT refresh tokens** stored in Redis (prod) / in-memory (local); rotated on each refresh.
- **Optimistic concerns**: competition list/detail cached (60s/30s); cache invalidated on writes.
- **Ports 8010 / 5174** — to avoid the ClientStories app on 8000 / 5173. Never touch the ClientStories/UAT environment.
