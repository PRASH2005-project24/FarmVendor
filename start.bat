@echo off
title FarmVendor Launcher

echo ========================================
echo   Starting FarmVendor Application
echo ========================================
echo.

:: Start Backend (Flask) in a new terminal
echo [1/2] Launching Backend (Flask)...
start "FarmVendor Backend" cmd /k "cd /d %~dp0backend && python app.py"

:: Small delay to let backend initialize first
timeout /t 3 /nobreak >nul

:: Start Frontend (Vite/React) in a new terminal
echo [2/2] Launching Frontend (React)...
start "FarmVendor Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo ========================================
echo.
echo You can close this window.
pause
