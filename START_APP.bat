@echo off
title EXAMFRIEND 24/7 Launcher
echo ===================================================
echo           STARTING EXAMFRIEND APPLICATION
echo ===================================================
echo.

cd /d "%~dp0backend"
echo [1/3] Starting FastAPI Backend & Web Server...
start "" /b .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

timeout /t 2 /nobreak >nul

cd /d "%~dp0"
echo [2/3] Starting Cloudflare Public 24/7 Online Tunnel...
start "" /b cloudflared.exe tunnel --url http://127.0.0.1:8000

timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo  EXAMFRIEND IS RUNNING!
echo  Local URL:  http://localhost:8000
echo.
echo  To find your public link, open:
echo  c:\Users\Riya\.gemini\antigravity\brain\...\
echo ===================================================
start http://localhost:8000
pause

