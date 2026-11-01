@echo off
title Push ExamFriend to GitHub for 24/7 Hosting
echo ========================================================
echo       PUSHING EXAMFRIEND TO GITHUB (24/7 HOSTING)
echo ========================================================
echo.
echo Target Repository: https://github.com/riyaa15/examfriend.git
echo.
echo Uploading project files to GitHub...
echo (If a browser window opens, click 'Sign in with your browser')
echo.

set GIT="C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe"

cd /d "%~dp0"
%GIT% branch -M main
%GIT% push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! All code is now safely on your GitHub!
    echo.
    echo  NEXT STEP:
    echo  Go to https://render.com and deploy for 24/7 online!
    echo ========================================================
) else (
    echo.
    echo Upload paused or failed. If asked, please complete the sign-in prompt.
)
echo.
pause
