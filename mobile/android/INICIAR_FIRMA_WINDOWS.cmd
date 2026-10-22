@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  python firma-asistida.py
) else (
  py -3 firma-asistida.py
)
echo.
pause
