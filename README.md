# 🐉 DRAGON — Gaming Competition Platform

A production-grade platform for hosting sponsored gaming competitions. Gamers sign up, register for tournaments, and winners receive prize money.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 async, asyncpg |
| Frontend | React 18, Vite, Tailwind CSS 3.4 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Dev | Docker Compose |

## Quick Start (local, no Docker)

Local dev needs **no Docker, Postgres, or Redis** — it uses SQLite + an in-memory cache.

**One-time setup:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-local.txt
.venv\Scripts\python.exe seed.py          # creates dragon.db + sample data
cd ../frontend
npm install
```

**Run** — double-click `start-local.bat`, or use two terminals:
```bash
# Backend
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload

# Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5174
- Backend API / docs: http://127.0.0.1:8010/docs

**Seed credentials:**
- Admin: `admin@dragon.gg` / `Admin@123`
- Player: `player@dragon.gg` / `Player@123`

> Ports 8010/5174 are used because another local app occupies 8000/5173.

## Production (Docker)

```bash
cp .env.example .env       # set SECRET_KEY, Postgres DATABASE_URL, USE_REDIS=true
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

Uses PostgreSQL + Redis (defined in `docker-compose.yml`). The backend selects
SQLite vs Postgres from `DATABASE_URL` and Redis vs in-memory from `USE_REDIS`.

## Features

- **Gamer accounts** — signup, login, profiles
- **Competition listings** — browse by game, status, search
- **Registration** — join competitions with validation (deadline, capacity, status)
- **Admin panel** — manage competitions, sponsors, users, declare winners
- **Sponsor management** — link sponsors to competitions with prize pools
- **Prize tracking** — manual winner declaration with prize amount recording

## Environment Variables

See [.env.example](.env.example) for all configurable variables.

## API Reference

Interactive Swagger UI at `/docs` when backend is running.

Key endpoints:
- `POST /auth/register` — create account
- `POST /auth/login` — get tokens
- `GET /competitions` — browse competitions (paginated)
- `POST /registrations` — register for a competition
- `GET /admin/stats` — admin dashboard stats (admin only)

## Contributing

Use a branch + Pull Request for each change (don't commit directly to `master`):

```bash
git checkout -b feature/my-change   # 1. branch off master
# ...make changes...
git add -A
git commit -m "feat: describe the change"
git push -u origin feature/my-change   # 2. push the branch
```

Then open a Pull Request (`feature/my-change` → `master`) on GitHub, review the
diff, and merge. This keeps `master` always working and gives every change a
reviewable history.
