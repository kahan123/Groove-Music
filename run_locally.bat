@echo off
echo Starting Local Song API...
echo.

cd /d "%~dp0"

echo [1/3] Checking Frontend Build...
if not exist "client\dist" (
    echo Frontend build not found! Building now...
    cd client
    if not exist "node_modules" (
        echo Installing frontend dependencies...
        call npm install
    )
    call npm run build
    cd ..
) else (
    echo Frontend build found.
)

echo.
echo [2/3] Checking Backend Dependencies...
cd Backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo [3/3] Starting Server...
echo Open http://localhost:3000 in your browser if it doesn't open automatically.
start http://localhost:3000
node index.js
pause
