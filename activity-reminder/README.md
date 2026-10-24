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

Activity statistics stay on this computer. The application does not record typed content, screenshots, or which applications you use. The Codex usage feature connects to OpenAI through your installed Codex CLI, as described below.

## Codex usage remaining

The dashboard header and floating timer display your Codex subscription allowance, including the five-hour and weekly windows when the service returns them. Select **Codex usage**, or click the usage text, for all available usage buckets, reset times, and **Refresh now**. Reset times use your computer's local timezone.

Usage updates automatically as you use Codex on this computer. Rise keeps a single Codex connection open and handles `account/rateLimits/updated` notifications. It also watches session-file change notifications under `CODEX_HOME/sessions` (or your profile's `.codex/sessions`) to detect activity in other local Codex processes. This watcher only observes filesystem metadata; it never opens conversation files or reads their contents. Local activity triggers an authoritative usage request rather than estimating quota from elapsed time or token counts.

Bursts are combined with a short debounce. During continuous use, pending updates are processed without waiting for a quiet period, with at least three seconds between request starts. Activity during an in-flight request is retained for the next read. There is no recurring five-minute usage poll while idle. Startup, returning to the main window after a gap, and a reported reset deadline also trigger a check. Connection failures retry automatically after a short delay. **Refresh now** remains available for troubleshooting, not normal operation.

Remaining percentage is calculated as `100 - usedPercent`; a missing value is shown as unavailable. Readings include a timestamp. The app retains the last successful reading in memory and labels it as last known if refreshing fails. Passing a reset time triggers a fresh read and does not automatically assume that your allowance has refilled. Updates depend on Codex reporting usage and the service accounting for it; they are not a per-token meter. Use from other devices or cloud-only sessions may not be visible until the next notification, local activity, or window activation.

Install Codex and sign in with your ChatGPT account first. Rise finds `codex.exe` on PATH or in the desktop app's local installation directory. If needed, select **Choose Codex CLI** in the usage window. Rise runs one hidden `codex app-server` process over private standard input/output and uses the documented read-only `account/rateLimits/read` method and update notifications. It does not open a listening port, start an AI conversation, consume reset credits, purchase credits, or read/copy login tokens. Only the selected CLI path is saved; usage readings remain in memory. The child process closes when Rise exits.

This displays Codex subscription limits. It is not a counter for ordinary ChatGPT Chat messages or OpenAI API billing. ChatGPT Work and Codex share usage according to the [official pricing documentation](https://learn.chatgpt.com/docs/pricing). The protocol and fields are documented in the [official App Server reference](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt).

To verify the connection separately:

```powershell
Start-Process .\ActivityReminder.exe -ArgumentList '--quota-test' -Wait
Get-Content .\quota-test-result.txt
```

This check verifies two reads through the same persistent connection and prints only usage percentages and window names, not login credentials. Network or sign-in failures appear in the usage window with automatic retry and connection details.

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

The build uses the system C# compiler and generates the application icon and EXE. Self-tests cover timer rules, native Windows APIs, usage parsing, no usage polling while idle, debouncing, continuous activity, in-flight event retention, retry delay, and real filesystem notifications from a temporary synthetic session file. They do not require a network connection.

## Files

| File | Purpose |
| --- | --- |
| `ActivityReminder.exe` | Compiled Windows application |
| `ActivityReminder.cs` | Application source code |
| `CodexUsage.cs` | Codex usage client, quota parser, and usage window |
| `UsageUpdates.cs` | Persistent connection, activity watcher, update scheduling, and tests |
| `app.ico` | Application icon |
| `build.ps1` | Build script |
| `Start.bat` | Optional launcher |
