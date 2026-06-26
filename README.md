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

## Quick Start (Docker)

```bash
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Requires PostgreSQL and Redis running locally (or via Docker).

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
