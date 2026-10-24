@echo off
cd /d "%~dp0"
if exist "%~dp0ActivityReminder.exe" (
  start "" "%~dp0ActivityReminder.exe"
  exit /b
)
echo Application not found. Please run build.ps1 first.
pause
