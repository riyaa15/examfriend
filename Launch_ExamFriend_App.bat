@echo off
title Launching EXAMFRIEND Desktop App...

:: 1. Ensure FastAPI backend is running on 8000
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    cd /d "%~dp0backend"
    start "" /b .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
    timeout /t 2 /nobreak >nul
)

:: 2. Ensure Cloudflare public tunnel is running
tasklist /fi "imagename eq cloudflared.exe" | findstr /i "cloudflared.exe" >nul
if %errorlevel% neq 0 (
    cd /d "%~dp0"
    start "" /b cloudflared.exe tunnel --url http://127.0.0.1:8000
)

:: 3. Launch in Standalone Native Desktop App window mode
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8000" --app-id=examfriend --window-size=1280,850
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:8000" --app-id=examfriend --window-size=1280,850
) else (
    start http://localhost:8000
)
