@echo off
echo ========================================
echo   COLLIDE - Starting Development Mode
echo ========================================
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Check if Angular node_modules exists
if not exist "COLLIDE-FRONTEND\node_modules" (
    echo Installing Angular dependencies...
    cd COLLIDE-FRONTEND
    call npm install
    cd ..
)

echo Starting COLLIDE...
echo (The app will automatically start the Angular server)
echo.

:: Start Electron which will handle Angular
call npm run dev

pause

