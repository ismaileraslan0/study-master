@echo off
echo ========================================
echo   StudyMaster Baslatiliyor...
echo ========================================

REM Frontend baslat (yeni pencere)
start "StudyMaster Frontend" cmd /k "cd /d %~dp0 && npm run dev"

REM Bot baslat (yeni pencere)
start "AGS Disiplin Botu" cmd /k "cd /d %~dp0\bot && node index.js"

echo.
echo ✅ Her iki servis baslatildi!
echo    Frontend: http://localhost:5173
echo    Bot API:  http://localhost:3001
echo.
pause
