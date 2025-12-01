@echo off
echo Starting COLLIDE Development Environment...
echo.

echo [1/2] Starting Angular dev server...
start "Angular Server" cmd /k "cd COLLIDE-FRONTEND && npm start"

echo.
echo Waiting for Angular to start on port 4200...
timeout /t 15 /nobreak >nul

echo.
echo [2/2] Starting Electron...
call npx electron ./Electron/main.js

