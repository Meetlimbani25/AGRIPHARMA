@echo off
setlocal

cd /d "%~dp0"

echo Starting AI Plant Disease Detection...

echo.
echo [1/2] Starting backend server...
start "Backend API" cmd /k "cd /d ""%~dp0backend"" && npm start"

echo [2/2] Starting frontend app...
start "Frontend App" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo.
echo Project started.
echo Backend and frontend are running in separate windows.
echo.
pause
