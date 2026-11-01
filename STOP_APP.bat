@echo off
title STOP EXAMFRIEND
echo Stopping all EXAMFRIEND processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM cloudflared.exe /T 2>nul
echo All EXAMFRIEND background servers stopped successfully.
pause

