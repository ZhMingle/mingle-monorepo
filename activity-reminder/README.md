# Rise - Activity Reminder

A Windows desktop app that tracks active computer time and reminds you to stand up and move.

## Run

Open this folder in File Explorer and double-click **ActivityReminder.exe**. No Python, Node.js, or third-party packages are required. The app uses the .NET Framework included with Windows. `Start.bat` also launches it. File links inside Codex may open a preview instead of running the application.

The dashboard shows a countdown, time spent in the current session, active time today, and completed breaks. A draggable floating timer stays above other applications so you can see the countdown while working.

- Select **Use floating timer**, or close the main window, to keep tracking in the floating window.
- Select **Open app** in the floating window to return to the dashboard.
- Clear **Show floating timer** to hide the floating window.
- Right-click the system tray icon and select **Exit Rise** to quit completely.
- Opening the EXE again brings the existing dashboard forward without starting a second timer.

## Timing and reminders

The default reminder interval is 30 minutes of active use. Choose 15, 30, 45, or 60 minutes. Tracking pauses when the screen is locked or when there has been no keyboard or mouse input for the idle threshold: 1, 2, or 5 minutes. Sleep and long timer interruptions do not count as active use. You can also pause and resume manually.

When a break is due, the app plays a system sound and opens a reminder above other windows. Start a two-minute break or snooze for five more minutes of active use. Closing the reminder also snoozes it. A completed break resets the session timer and increases the daily break count. Locking or sleeping the computer pauses the break countdown. **Preview reminder** opens the reminder immediately.

The application must remain running to send reminders. It does not run while the computer is shut down.

## Local data

Settings, floating window position, and daily statistics are saved every 15 seconds and when exiting:

```text
%LOCALAPPDATA%\MingleActivityReminder\desktop-v2.json
```

The first run can import settings and statistics from an older `settings.json` in the same directory. Daily statistics reset at midnight; the current session continues. Manual pause, break countdown, and snooze state are not restored after quitting.

Nothing is uploaded. The application does not record typed content, screenshots, or which applications you use.

## Detection limits

This version monitors only the Windows computer running it. Keyboard and mouse activity provide an estimate: watching a video or reading without input eventually triggers the idle pause. Short periods away may count until the idle threshold is reached. Break completion is based on a countdown; the app cannot verify that you stood up.

Phone monitoring requires a separate Android or iOS application. This project does not include a phone app, cross-device synchronization, or automatic startup at login.

## Build and verify

Run these commands in this directory:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
Start-Process .\ActivityReminder.exe -ArgumentList '--self-test' -Wait
Get-Content .\test-result.txt
```

The build uses the system C# compiler and generates the application icon and EXE. Self-tests cover active timing, idle boundaries, locking, pausing, sleep gaps, reminder thresholds, snoozing, completed breaks, midnight rollover, countdown formatting, state serialization, and native Windows APIs.

## Files

| File | Purpose |
| --- | --- |
| `ActivityReminder.exe` | Compiled Windows application |
| `ActivityReminder.cs` | Application source code |
| `app.ico` | Application icon |
| `build.ps1` | Build script |
| `Start.bat` | Optional launcher |
