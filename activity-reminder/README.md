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

When a break is due, the app plays a system sound and opens a reminder above other windows. Start a five-minute break or snooze for five more minutes of active use. Closing the reminder also snoozes it. **Preview reminder** opens the reminder immediately.

Breaks use an actual five-minute deadline, independent of keyboard/mouse activity and the work timer's paused state. You can leave the computer, lock the screen, or let it sleep. After waking, the countdown catches up to elapsed time. A completed break increases the daily break count exactly once and automatically starts a new learning session of the selected length. It clears any previous manual pause or snooze. Break time never counts as active computer use.

Select **Skip break** in the main window or floating timer during a break to immediately start the next learning session. The reminder also offers **Skip break and start next session** before a break begins. Skipped breaks do not increase completed-break statistics. A skipped countdown is canceled, so its former deadline cannot interrupt your new session.

Each new learning session starts with a fresh idle window: time spent away during the previous break does not immediately pause it. Learning still pauses when locked, manually paused, or when there is no input for the configured idle threshold measured from the new session. You do not need to click Resume when a break ends.

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

Usage updates automatically after each completed Codex task on this computer. Rise watches newly appended lifecycle records under `CODEX_HOME/sessions` (or your profile's `.codex/sessions`) and refreshes when it finds a root `task_complete` event. A stopped task can also trigger a refresh when Codex records `turn_aborted` with its turn ID. Thinking, token-count events, tool execution, individual tool completions, and child-task completions do not trigger quota requests.

Rise records existing file lengths at startup so old completed tasks are not replayed. It incrementally parses only new records, checks the lifecycle type and turn ID, handles partially written lines, and deduplicates completions. It discards other record data and never saves or uploads conversation contents. Simultaneous completions are combined with a short debounce; a completion received during an in-flight request is retained for the next read. One task means one Codex turn, including all its thinking and tool calls.

The app reads usage once on startup, then automatically after task completion. Window activation, reset deadlines, intermediate usage notifications, and idle time do not initiate refreshes. A failed refresh is retried after the next completed task; there is no timed retry loop during thinking. **Refresh now** remains an explicit troubleshooting option. Rise reuses its private Codex connection and reconnects for the next request if the previous process has exited.

Remaining percentage is calculated as `100 - usedPercent`; a missing value is shown as unavailable. Readings include a timestamp. The app retains the last successful reading in memory and labels it as last known if refreshing fails. Passing a reset time does not assume that your allowance has refilled. Updates depend on Codex recording completion and the service accounting for usage; they are not a per-token meter. Usage from other devices or cloud-only sessions becomes visible at the next local task completion or explicit refresh.

Install Codex and sign in with your ChatGPT account first. Rise finds `codex.exe` on PATH or in the desktop app's local installation directory. If needed, select **Choose Codex CLI** in the usage window. Rise runs one hidden `codex app-server` process over private standard input/output and uses the documented read-only `account/rateLimits/read` method. It ignores unsolicited usage notifications to keep displayed usage stable during tasks. It does not open a listening port, start an AI conversation, consume reset credits, purchase credits, or read/copy login tokens. Only the selected CLI path is saved; usage readings remain in memory. The child process closes when Rise exits.

This displays Codex subscription limits. It is not a counter for ordinary ChatGPT Chat messages or OpenAI API billing. ChatGPT Work and Codex share usage according to the [official pricing documentation](https://learn.chatgpt.com/docs/pricing). The protocol and fields are documented in the [official App Server reference](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt).

To verify the connection separately:

```powershell
Start-Process .\ActivityReminder.exe -ArgumentList '--quota-test' -Wait
Get-Content .\quota-test-result.txt
```

This check verifies two reads through the same persistent connection and prints only usage percentages and window names, not login credentials. Network or sign-in failures appear in the usage window; the next completed task triggers another attempt.

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

The build uses the system C# compiler and generates the application icon and EXE. Self-tests cover timer rules, native Windows APIs, usage parsing, idle behavior, completion scheduling, partial records, duplicate completions, child tasks, and real filesystem notifications from a synthetic session. They verify that thinking/token events and tool completions do not refresh usage, historical completions are skipped, and later file changes do not replay a completed task. Tests do not require a network connection.

## Files

| File | Purpose |
| --- | --- |
| `ActivityReminder.exe` | Compiled Windows application |
| `ActivityReminder.cs` | Application source code |
| `CodexUsage.cs` | Codex usage client, quota parser, and usage window |
| `UsageUpdates.cs` | Persistent connection, task completion detection, update scheduling, and tests |
| `app.ico` | Application icon |
| `build.ps1` | Build script |
| `Start.bat` | Optional launcher |
