@echo off
setlocal

echo ========================================================
echo   STARTING CLASS CHAMPIONS - أبطال الفصل
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Django Backend on http://127.0.0.1:8000 ...
start "Class Champions - Django Backend" cmd /k "backend\venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Class Champions - React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   APPLICATION RUNNING!
echo ========================================================
echo   Web Application URL: http://localhost:5173
echo   Django Backend API:  http://127.0.0.1:8000/api/
echo   Django Admin:        http://127.0.0.1:8000/admin/
echo.
echo   Initial Accounts:
echo   - Administrator: admin@classchampions.edu / AdminPass2026!
echo   - Teacher Registration Code: teach2026
echo ========================================================
echo.
pause
