@echo off
REM Start DRAGON locally (no Docker): SQLite backend on :8010, Vite frontend on :5174.
REM Run one-time setup first (see README): create venv, pip install, seed.py, npm install.

echo Starting DRAGON backend on http://127.0.0.1:8010 ...
start "DRAGON backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload"

echo Starting DRAGON frontend on http://localhost:5174 ...
start "DRAGON frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo DRAGON is starting in two new windows.
echo   Frontend: http://localhost:5174
echo   API docs: http://127.0.0.1:8010/docs
echo   Admin:    admin@dragon.gg / Admin@123
echo   Player:   player@dragon.gg / Player@123
