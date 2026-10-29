@echo off
cd /d "%~dp0"
if exist "%~dp0ActivityReminder.next.exe" (
  copy /y "%~dp0ActivityReminder.next.exe" "%~dp0ActivityReminder.exe" >nul 2>&1
  if errorlevel 1 (
    echo Please exit Rise from its tray menu, then run Start.bat again to install the update.
    pause
    exit /b 1
  )
  del "%~dp0ActivityReminder.next.exe"
)
if exist "%~dp0ActivityReminder.exe" (
  start "" "%~dp0ActivityReminder.exe"
  exit /b
)
echo Application not found. Please run build.ps1 first.
pause
