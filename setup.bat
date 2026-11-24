@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   CLASS CHAMPIONS - أبطال الفصل
echo   Automated Windows Setup Script
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check Python installation
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10+ and re-run.
    pause
    exit /b 1
)
python --version

:: 2. Check Node.js and NPM installation
echo.
echo [2/6] Checking Node.js and npm installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js 18+ and re-run.
    pause
    exit /b 1
)
node --version

:: 3. Setup Backend Virtual Environment & Dependencies
echo.
echo [3/6] Setting up Backend Python Virtual Environment...
if not exist "backend\venv" (
    echo Creating virtual environment in backend\venv...
    python -m venv backend\venv
)

echo Installing backend requirements...
backend\venv\Scripts\pip.exe install -r backend\requirements.txt

:: 4. Prepare Environment Configuration
echo.
echo [4/6] Checking environment configuration (.env)...
if not exist "backend\.env" (
    echo Copying .env.example to backend\.env...
    copy .env.example backend\.env
)

:: 5. Run Database Migrations & Safe Seeding
echo.
echo [5/6] Running database migrations and safe data seeding...
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_data
backend\venv\Scripts\python.exe backend\manage.py init_admin

:: 6. Setup Frontend NPM Dependencies
echo.
echo [6/6] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ========================================================
echo   Default Administrator:
echo     Email:    admin@classchampions.edu
echo     Password: AdminPass2026!
echo.
echo   Teacher Access Code:
echo     Code:     teach2026
echo.
echo   To launch the application, simply run:
echo     run.bat
echo ========================================================
echo.
pause
