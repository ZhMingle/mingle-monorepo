using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace Mingle.ActivityReminder
{
    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            if (Array.IndexOf(args, "--self-test") >= 0) return Tests.Run();
            if (Array.IndexOf(args, "--quota-test") >= 0) return CodexUsageClient.LiveTest();
            bool created;
            using (var mutex = new Mutex(true, "Local\\MingleActivityReminder", out created))
            using (var wake = new EventWaitHandle(false, EventResetMode.AutoReset, "Local\\MingleActivityReminder.Open"))
            {
                if (!created)
                {
                    wake.Set();
                    return 0;
                }
                try
                {
                    Application.Run(new MainWindow(wake));
                    return 0;
                }
                catch (Exception ex)
                {
                    MessageBox.Show("The application could not start:\n" + ex.Message, "Rise - Activity Reminder", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return 1;
                }
                finally { mutex.ReleaseMutex(); }
            }
        }
    }

    public sealed class SavedState
    {
        public int interval = 30;
        public int idle = 120;
        public double total;
        public double cycle;
        public int breaks;
        public string date = DateTime.Now.ToString("yyyy-MM-dd");
        public bool floating = true;
        public string codexPath;
        public int miniX = int.MinValue;
        public int miniY = int.MinValue;
    }

    internal sealed class UsageClock
    {
        internal SavedState State;
        internal bool Paused;
        internal const double RestDurationSeconds = 300;
        private readonly Func<DateTime> utcNow;
        private DateTime? restEndsUtc;
        internal double RestRemaining { get { return restEndsUtc.HasValue ? Math.Max(0, (restEndsUtc.Value - utcNow()).TotalSeconds) : 0; } }
        internal double SnoozeRemaining;
        internal bool Resting { get { return restEndsUtc.HasValue; } }
        internal UsageClock(SavedState state, Func<DateTime> utcNow = null) { State = state; this.utcNow = utcNow ?? (() => DateTime.UtcNow); }
        internal static double Count(double elapsed, double idle, double limit, bool locked, bool paused)
        {
            if (locked || paused || elapsed <= 0 || elapsed > 5 || double.IsNaN(idle)) return 0;
            return Math.Max(0.0, Math.Min(elapsed, limit - idle));
        }
        internal void Step(double elapsed, double idle, bool locked, DateTime today)
        {
            string date = today.ToString("yyyy-MM-dd");
            if (State.date != date) { State.date = date; State.total = 0; State.breaks = 0; }
            if (Resting)
            {
                // Break time is actual elapsed time away from the computer.
                // Locking, sleeping, idling, and delayed UI ticks must not stop it.
                if (RestRemaining <= 0) { restEndsUtc = null; State.cycle = 0; State.breaks++; SnoozeRemaining = 0; }
                return;
            }
            double used = Count(elapsed, idle, State.idle, locked, Paused);
            State.total += used;
            State.cycle += used;
            SnoozeRemaining = Math.Max(0, SnoozeRemaining - used);
        }
        internal double Remaining
        {
            get { return Resting ? RestRemaining : SnoozeRemaining > 0 ? SnoozeRemaining : Math.Max(0, State.interval * 60 - State.cycle); }
        }
        internal bool Due { get { return !Resting && !Paused && State.cycle >= State.interval * 60 && SnoozeRemaining <= 0; } }
        internal void StartRest() { restEndsUtc = utcNow().AddSeconds(RestDurationSeconds); SnoozeRemaining = 0; }
        internal void Snooze() { SnoozeRemaining = 300; }
        internal static string Format(double seconds)
        {
            int n = (int)Math.Ceiling(Math.Max(0, seconds));
            return string.Format("{0:00}:{1:00}", n / 60, n % 60);
        }
    }

    internal static class Native
    {
        [StructLayout(LayoutKind.Sequential)] private struct LastInput { public uint size; public uint time; }
        [DllImport("user32.dll")] private static extern bool GetLastInputInfo(ref LastInput info);
        [DllImport("kernel32.dll")] private static extern ulong GetTickCount64();
        [DllImport("user32.dll")] private static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);
        [DllImport("user32.dll")] private static extern bool SwitchDesktop(IntPtr desktop);
        [DllImport("user32.dll")] private static extern bool CloseDesktop(IntPtr desktop);
        internal static double Idle()
        {
            var info = new LastInput(); info.size = (uint)Marshal.SizeOf(info);
            if (!GetLastInputInfo(ref info)) return double.PositiveInfinity;
            return unchecked((uint)GetTickCount64() - info.time) / 1000.0;
        }
        internal static bool Locked()
        {
            IntPtr desktop = OpenInputDesktop(0, false, 0x100);
            if (desktop == IntPtr.Zero) return true;
            try { return !SwitchDesktop(desktop); } finally { CloseDesktop(desktop); }
        }
    }

    internal static class Theme
    {
        internal static readonly Color Bg = Color.FromArgb(17, 24, 31);
        internal static readonly Color Card = Color.FromArgb(26, 36, 45);
        internal static readonly Color Mint = Color.FromArgb(140, 236, 195);
        internal static readonly Color White = Color.FromArgb(239, 245, 244);
        internal static readonly Color Muted = Color.FromArgb(154, 174, 181);
        internal static Font Font(float size, FontStyle style) { return new Font("Segoe UI", size, style, GraphicsUnit.Point); }
        internal static Label Label(Control parent, string text, int x, int y, int w, int h, float size, Color color)
        {
            var label = new Label { Text = text, Location = new Point(x, y), Size = new Size(w, h), BackColor = Color.Transparent, ForeColor = color, Font = Font(size, FontStyle.Regular) };
            parent.Controls.Add(label);
            return label;
        }
        internal static Button Button(Control parent, string text, int x, int y, int w, bool primary, Action action)
        {
            var button = new Button { Text = text, Location = new Point(x, y), Size = new Size(w, 40), FlatStyle = FlatStyle.Flat, Cursor = Cursors.Hand,
                BackColor = primary ? Mint : Color.FromArgb(39, 54, 64), ForeColor = primary ? Bg : White, Font = Font(10, FontStyle.Regular) };
            button.FlatAppearance.BorderSize = 0;
            button.Click += delegate { action(); };
            parent.Controls.Add(button);
            return button;
        }
        internal static Panel CardPanel(Control parent, int x, int y, int w, int h)
        {
            var panel = new Panel { Location = new Point(x, y), Size = new Size(w, h), BackColor = Card };
            parent.Controls.Add(panel);
            return panel;
        }
    }

    internal sealed class TimerDial : Control
    {
        internal string Time = "30:00";
        internal string Caption = "Until your next break";
        internal double Progress;
        internal TimerDial() { DoubleBuffered = true; BackColor = Theme.Card; AccessibleName = "Activity reminder countdown"; }
        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics; g.SmoothingMode = SmoothingMode.AntiAlias;
            int d = Math.Min(Width - 26, Height - 26);
            var rect = new Rectangle((Width - d) / 2, (Height - d) / 2, d, d);
            using (var track = new Pen(Color.FromArgb(43, 60, 69), 7)) g.DrawEllipse(track, rect);
            using (var pen = new Pen(Theme.Mint, 7))
            {
                pen.StartCap = LineCap.Round; pen.EndCap = LineCap.Round;
                g.DrawArc(pen, rect, -90, (float)Math.Max(0.01, Math.Min(1, Progress) * 360));
            }
            using (var font = new Font("Segoe UI", 43, FontStyle.Regular))
                TextRenderer.DrawText(g, Time, font, new Rectangle(0, Height / 2 - 50, Width, 82), Theme.White, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPadding);
            using (var font = Theme.Font(10, FontStyle.Regular))
                TextRenderer.DrawText(g, Caption, font, new Rectangle(0, Height / 2 + 38, Width, 30), Theme.Muted, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }
    }

    internal sealed class MiniWindow : Form
    {
        private readonly MainWindow main;
        private readonly Label countdown, status, quota, quotaAge;
        private readonly Button pause;
        internal MiniWindow(MainWindow main)
        {
            this.main = main;
            Text = "Rise - Floating Timer"; ClientSize = new Size(300, 244);
            FormBorderStyle = FormBorderStyle.FixedToolWindow; StartPosition = FormStartPosition.Manual;
            AutoScaleMode = AutoScaleMode.Dpi; BackColor = Theme.Card; ForeColor = Theme.White;
            TopMost = true; ShowInTaskbar = false; Icon = main.Icon;
            status = Theme.Label(this, "Tracking active time", 16, 10, 268, 25, 9, Theme.Muted);
            status.AutoEllipsis = true;
            countdown = Theme.Label(this, "30:00", 12, 33, 256, 63, 34, Theme.Mint);
            countdown.Font = new Font("Segoe UI", 34);
            quota = Theme.Label(this, "Codex: checking usage...", 16, 101, 268, 25, 10, Theme.Mint);
            quota.AutoEllipsis = true; quota.Cursor = Cursors.Hand; quota.Click += delegate { main.ShowQuota(); };
            quotaAge = Theme.Label(this, "", 16, 129, 268, 42, 9, Theme.Muted);
            quotaAge.AutoEllipsis = true;
            Theme.Button(this, "Open app", 16, 188, 128, false, main.ShowMain);
            pause = Theme.Button(this, "Pause", 156, 188, 128, false, main.TogglePause);
            FormClosing += delegate(object sender, FormClosingEventArgs e) { if (!main.Exiting) { e.Cancel = true; main.SetFloating(false); main.ShowMain(); } };
            Move += delegate { if (Visible) { main.Clock.State.miniX = Left; main.Clock.State.miniY = Top; } };
        }
        protected override bool ShowWithoutActivation { get { return true; } }
        internal void RefreshClock(string text)
        {
            countdown.Text = UsageClock.Format(main.Clock.Remaining); status.Text = text;
            pause.Text = main.Clock.Resting ? "On a break" : main.Clock.Paused ? "Resume" : "Pause";
            pause.Enabled = !main.Clock.Resting;
            quota.Text = main.QuotaSummary;
            quotaAge.Text = main.QuotaCompactStatus;
        }
        internal void Place()
        {
            Rectangle area = Screen.PrimaryScreen.WorkingArea;
            var saved = new Rectangle(main.Clock.State.miniX, main.Clock.State.miniY, Width, Height);
            bool usable = false;
            foreach (Screen screen in Screen.AllScreens) if (screen.WorkingArea.Contains(saved)) usable = true;
            Location = usable ? saved.Location : new Point(area.Right - Width - 24, area.Bottom - Height - 24);
        }
    }

    internal sealed class MainWindow : Form
    {
        internal UsageClock Clock;
        internal bool Exiting;
        private readonly EventWaitHandle wake;
        private readonly string dataFile;
        private readonly NotifyIcon tray;
        private readonly System.Windows.Forms.Timer timer;
        private readonly Stopwatch watch = Stopwatch.StartNew();
        private readonly TimerDial dial;
        private readonly Label status, total, cycle, breaks, footer;
        private readonly Button pause;
        private readonly CheckBox floating;
        private readonly MiniWindow mini;
        private Form reminder;
        private double last, lastSave;
        private bool saveFailed;
        internal QuotaSnapshot Quota;
        internal bool QuotaLoading;
        private string quotaError;
        private readonly UsageUpdateSchedule quotaSchedule = new UsageUpdateSchedule();
        private UsageActivityMonitor usageMonitor;
        private CodexUsageConnection usageConnection;
        private UsageWindow usageWindow;
        private readonly Label usageLine;
        internal string QuotaSummary
        {
            get { return Quota == null ? (QuotaLoading ? "Codex: checking usage..." : "Codex usage unavailable") : "Codex " + Quota.Main.Summary; }
        }
        internal string QuotaCompactStatus
        {
            get
            {
                if (QuotaLoading) return Quota == null ? "Connecting to your Codex sign-in" : "Updating last known usage...";
                if (quotaError != null) return Quota == null ? "Click usage above for connection details" : "Last known usage - refresh failed";
                if (Quota == null) return "Click usage above to connect";
                var window = Quota.Main.Primary ?? Quota.Main.Secondary;
                return window.Reset + "\nUpdated " + Quota.FetchedUtc.ToLocalTime().ToString("HH:mm:ss");
            }
        }
        internal string QuotaStatus
        {
            get
            {
                if (QuotaLoading) return "Refreshing from your local Codex sign-in...";
                if (quotaError != null) return (Quota == null ? "" : "Showing last known usage. ") + quotaError;
                return Quota == null ? "No usage data yet." : "Updated " + Quota.FetchedUtc.ToLocalTime().ToString("MMM d, HH:mm:ss") + (usageMonitor != null && usageMonitor.Watching ? " · Updates after each completed task" : " · Task monitoring unavailable; reconnect to Codex");
            }
        }
        internal MainWindow(EventWaitHandle wake)
        {
            this.wake = wake;
            dataFile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MingleActivityReminder", "desktop-v2.json");
            Clock = new UsageClock(LoadState());
            Text = "Rise - Activity Reminder"; ClientSize = new Size(860, 654); MinimumSize = Size; MaximumSize = Size;
            AutoScaleMode = AutoScaleMode.Dpi; StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false;
            BackColor = Theme.Bg; ForeColor = Theme.White; Font = Theme.Font(10, FontStyle.Regular);
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            Theme.Label(this, "Rise", 32, 22, 240, 46, 26, Theme.Mint);
            usageLine = Theme.Label(this, "Codex: checking usage...", 34, 73, 790, 26, 10, Theme.Mint);
            usageLine.Cursor = Cursors.Hand; usageLine.Click += delegate { ShowQuota(); };
            Theme.Button(this, "Codex usage", 480, 32, 150, false, ShowQuota);
            Theme.Button(this, "Use floating timer", 648, 32, 178, false, delegate { SetFloating(true); Hide(); });

            Panel timerCard = Theme.CardPanel(this, 32, 116, 490, 344);
            status = Theme.Label(timerCard, "●  Tracking active time", 22, 16, 448, 27, 10, Theme.Mint);
            dial = new TimerDial { Location = new Point(100, 46), Size = new Size(290, 234) };
            timerCard.Controls.Add(dial);
            pause = Theme.Button(timerCard, "Pause timer", 24, 288, 210, false, TogglePause);
            Theme.Button(timerCard, "Take a 5-minute break", 248, 288, 218, true, StartRest);

            Panel settings = Theme.CardPanel(this, 542, 116, 284, 344);
            Theme.Label(settings, "Your break rhythm", 22, 19, 245, 32, 14, Theme.White);
            Theme.Label(settings, "Remind me after", 22, 67, 240, 24, 10, Theme.Muted);
            ComboBox interval = Combo(settings, new string[] { "15 minutes", "30 minutes", "45 minutes", "60 minutes" }, 22, 96);
            interval.SelectedIndex = Array.IndexOf(new int[] { 15, 30, 45, 60 }, Clock.State.interval);
            interval.SelectedIndexChanged += delegate { Clock.State.interval = new int[] { 15, 30, 45, 60 }[interval.SelectedIndex]; Save(); RefreshDisplay(0, false); };
            Theme.Label(settings, "Pause when idle for", 22, 144, 240, 24, 10, Theme.Muted);
            ComboBox idle = Combo(settings, new string[] { "1 minute", "2 minutes", "5 minutes" }, 22, 173);
            idle.SelectedIndex = Array.IndexOf(new int[] { 60, 120, 300 }, Clock.State.idle);
            idle.SelectedIndexChanged += delegate { Clock.State.idle = new int[] { 60, 120, 300 }[idle.SelectedIndex]; Save(); };
            floating = new CheckBox { Text = "Show floating timer", Location = new Point(22, 224), Size = new Size(245, 29), ForeColor = Theme.White, Checked = Clock.State.floating };
            settings.Controls.Add(floating);
            floating.CheckedChanged += delegate { SetFloating(floating.Checked); };
            Theme.Button(settings, "Preview reminder", 22, 288, 240, false, ShowReminder);

            Panel metric1 = Theme.CardPanel(this, 32, 480, 252, 98);
            Panel metric2 = Theme.CardPanel(this, 304, 480, 252, 98);
            Panel metric3 = Theme.CardPanel(this, 576, 480, 250, 98);
            Theme.Label(metric1, "Active time today", 18, 13, 220, 24, 10, Theme.Muted);
            Theme.Label(metric2, "Time this session", 18, 13, 220, 24, 10, Theme.Muted);
            Theme.Label(metric3, "Breaks completed today", 18, 13, 220, 24, 10, Theme.Muted);
            total = Theme.Label(metric1, "0 min", 16, 43, 223, 42, 21, Theme.White);
            cycle = Theme.Label(metric2, "00:00", 16, 43, 223, 42, 21, Theme.White);
            breaks = Theme.Label(metric3, "0 breaks", 16, 43, 223, 42, 21, Theme.White);
            footer = Theme.Label(this, "Local data only · Auto-pause when locked or idle · Close to keep the floating timer", 34, 601, 790, 30, 9, Theme.Muted);

            mini = new MiniWindow(this); mini.Place();
            var menu = new ContextMenuStrip();
            menu.Items.Add("Open app", null, delegate { ShowMain(); });
            menu.Items.Add("Show floating timer", null, delegate { SetFloating(true); });
            menu.Items.Add("Pause / Resume", null, delegate { TogglePause(); });
            menu.Items.Add("Codex usage", null, delegate { ShowQuota(); });
            menu.Items.Add("Refresh usage", null, delegate { RefreshQuota(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Exit Rise", null, delegate { ExitApp(); });
            tray = new NotifyIcon { Text = "Rise - Starting", Icon = Icon, ContextMenuStrip = menu, Visible = true };
            tray.DoubleClick += delegate { ShowMain(); };
            Shown += delegate
            {
                usageMonitor = new UsageActivityMonitor(UsageActivityMonitor.CodexHome);
                usageMonitor.Changed += QueueUsageUpdate;
                if (Clock.State.floating) mini.Show();
                RefreshDisplay(Native.Idle(), Native.Locked()); RefreshQuota();
            };
            FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                if (e.CloseReason == CloseReason.UserClosing && !Exiting) { e.Cancel = true; SetFloating(true); Hide(); }
                else { Exiting = true; Save(); }
            };
            timer = new System.Windows.Forms.Timer { Interval = 250 };
            timer.Tick += delegate { TickClock(); };
            last = watch.Elapsed.TotalSeconds; timer.Start();
            RefreshDisplay(0, false);
        }
        private ComboBox Combo(Control parent, string[] items, int x, int y)
        {
            var combo = new ComboBox { Location = new Point(x, y), Width = 240, DropDownStyle = ComboBoxStyle.DropDownList, Font = Theme.Font(11, FontStyle.Regular) };
            combo.Items.AddRange(items); parent.Controls.Add(combo); return combo;
        }
        private SavedState LoadState()
        {
            try
            {
                string file = File.Exists(dataFile) ? dataFile : Path.Combine(Path.GetDirectoryName(dataFile), "settings.json");
                if (!File.Exists(file)) return new SavedState();
                var s = new JavaScriptSerializer().Deserialize<SavedState>(File.ReadAllText(file));
                if (s == null) return new SavedState();
                if (Array.IndexOf(new int[] { 15, 30, 45, 60 }, s.interval) < 0) s.interval = 30;
                if (Array.IndexOf(new int[] { 60, 120, 300 }, s.idle) < 0) s.idle = 120;
                if (double.IsNaN(s.total) || double.IsInfinity(s.total) || s.total < 0) s.total = 0;
                if (double.IsNaN(s.cycle) || double.IsInfinity(s.cycle) || s.cycle < 0) s.cycle = 0;
                s.breaks = Math.Max(0, s.breaks);
                if (s.date != DateTime.Now.ToString("yyyy-MM-dd")) { s.date = DateTime.Now.ToString("yyyy-MM-dd"); s.total = 0; s.breaks = 0; }
                return s;
            }
            catch { return new SavedState(); }
        }
        private void Save()
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(dataFile));
                File.WriteAllText(dataFile + ".tmp", new JavaScriptSerializer().Serialize(Clock.State));
                if (File.Exists(dataFile)) File.Replace(dataFile + ".tmp", dataFile, null);
                else File.Move(dataFile + ".tmp", dataFile);
                saveFailed = false;
            }
            catch { saveFailed = true; }
        }
        private void TickClock()
        {
            if (wake.WaitOne(0)) ShowMain();
            double now = watch.Elapsed.TotalSeconds, elapsed = now - last; last = now;
            double idle = Native.Idle(); bool locked = Native.Locked();
            Clock.Step(elapsed, idle, locked, DateTime.Now);
            RefreshDisplay(idle, locked);
            if (Clock.Due && !locked && idle < Clock.State.idle && reminder == null) ShowReminder();
            if (now - lastSave >= 15) { Save(); lastSave = now; }
            if (quotaSchedule.Ready(now) && !QuotaLoading) RefreshQuota();
        }
        private void RefreshDisplay(double idle, bool locked)
        {
            string text = Clock.Resting ? "On a break - time to move" : Clock.Paused ? "Paused - resume when ready" : locked ? "Screen locked - auto-paused" : idle >= Clock.State.idle ? "Away - auto-paused" : "Tracking active time";
            if (!Clock.Resting && Clock.SnoozeRemaining > 0) text += " · Snoozed";
            status.Text = "●  " + text;
            status.ForeColor = !Clock.Resting && (Clock.Paused || locked || idle >= Clock.State.idle) ? Theme.Muted : Theme.Mint;
            dial.Time = UsageClock.Format(Clock.Remaining);
            dial.Caption = Clock.Resting ? "Rest your eyes. Move a little." : Clock.SnoozeRemaining > 0 ? "Until the next reminder" : "Until your next break";
            dial.Progress = Clock.Resting ? 1 - Clock.RestRemaining / UsageClock.RestDurationSeconds : Math.Min(1, Clock.State.cycle / (Clock.State.interval * 60));
            dial.AccessibleName = dial.Caption + " " + dial.Time; dial.Invalidate();
            total.Text = ((int)(Clock.State.total / 60)).ToString() + " min";
            cycle.Text = UsageClock.Format(Clock.State.cycle);
            breaks.Text = Clock.State.breaks.ToString() + (Clock.State.breaks == 1 ? " break" : " breaks");
            pause.Text = Clock.Resting ? "On a break" : Clock.Paused ? "Resume timer" : "Pause timer";
            pause.Enabled = !Clock.Resting;
            usageLine.Text = QuotaSummary + (quotaError != null && Quota != null ? " (last known)" : "");
            if (mini != null) mini.RefreshClock(text);
            if (tray != null) tray.Text = "Rise · " + dial.Time + " · " + text;
            footer.Text = saveFailed ? "Could not save settings. Check local disk space and permissions." : "Local data only · Auto-pause when locked or idle · Close to keep the floating timer";
        }
        internal void ShowMain()
        {
            Show(); WindowState = FormWindowState.Normal; Activate();
        }
        internal void ShowQuota()
        {
            if (usageWindow == null || usageWindow.IsDisposed) usageWindow = new UsageWindow(this);
            usageWindow.RefreshData(); usageWindow.Show(); usageWindow.Activate();
        }
        private void QueueUsageUpdate()
        {
            if (Exiting || IsDisposed || !IsHandleCreated) return;
            try { BeginInvoke((Action)delegate { if (!Exiting) quotaSchedule.Signal(watch.Elapsed.TotalSeconds); }); } catch (InvalidOperationException) { }
        }
        private void ApplyQuota(QuotaSnapshot snapshot)
        {
            if (Quota != null && snapshot.FetchedUtc < Quota.FetchedUtc) return;
            Quota = snapshot; quotaError = null;
            RefreshDisplay(Native.Idle(), Native.Locked());
            if (usageWindow != null && !usageWindow.IsDisposed) usageWindow.RefreshData();
        }
        internal void SetCodexPath(string path)
        {
            Clock.State.codexPath = path; Save();
            if (usageConnection != null) { usageConnection.Dispose(); usageConnection = null; }
            RefreshQuota();
        }
        internal async void RefreshQuota()
        {
            if (QuotaLoading || Exiting) return;
            QuotaLoading = true; quotaError = null;
            quotaSchedule.Started(watch.Elapsed.TotalSeconds);
            if (usageWindow != null && !usageWindow.IsDisposed) usageWindow.RefreshData();
            if (usageConnection == null || !usageConnection.IsAlive)
            {
                if (usageConnection != null) usageConnection.Dispose();
                usageConnection = new CodexUsageConnection(Clock.State.codexPath);
            }
            CodexUsageConnection connection = usageConnection;
            try
            {
                QuotaSnapshot snapshot = await Task.Run(() => connection.Read());
                if (!Exiting && !IsDisposed) ApplyQuota(snapshot);
            }
            catch (Exception ex)
            {
                quotaError = ex.Message;
                if (usageConnection == connection) { connection.Dispose(); usageConnection = null; }
            }
            finally
            {
                QuotaLoading = false;
                if (!Exiting && !IsDisposed)
                {
                    RefreshDisplay(Native.Idle(), Native.Locked());
                    if (usageWindow != null && !usageWindow.IsDisposed) usageWindow.RefreshData();
                }
            }
        }
        internal void TogglePause() { Clock.Paused = !Clock.Paused; RefreshDisplay(Native.Idle(), Native.Locked()); }
        internal void SetFloating(bool visible)
        {
            Clock.State.floating = visible;
            if (floating.Checked != visible) floating.Checked = visible;
            if (mini != null) { if (visible) { if (!mini.Visible) mini.Place(); mini.Show(); } else mini.Hide(); }
            Save();
        }
        private void StartRest()
        {
            Clock.StartRest();
            if (reminder != null) reminder.Close();
            SetFloating(true); RefreshDisplay(0, false);
        }
        private void ShowReminder()
        {
            if (reminder != null) { reminder.Activate(); return; }
            var r = new Form { Text = "Rise · Time to move", ClientSize = new Size(500, 320), BackColor = Theme.Bg, ForeColor = Theme.White,
                AutoScaleMode = AutoScaleMode.Dpi, FormBorderStyle = FormBorderStyle.FixedDialog, StartPosition = FormStartPosition.CenterScreen, TopMost = true,
                MaximizeBox = false, MinimizeBox = false, Icon = Icon };
            reminder = r;
            Theme.Label(r, "Take five minutes.", 30, 28, 440, 54, 26, Theme.Mint);
            Theme.Label(r, "Stand up. Stretch. Walk a little.", 32, 99, 436, 36, 17, Theme.White);
            Theme.Label(r, "Relax your shoulders and look into the distance.\nYour timer restarts after this break.", 32, 151, 436, 66, 11, Theme.Muted);
            Theme.Button(r, "Start 5-minute break", 32, 244, 211, true, StartRest);
            Theme.Button(r, "Snooze for 5 minutes", 257, 244, 211, false, delegate { Clock.Snooze(); r.Close(); });
            r.FormClosed += delegate { reminder = null; if (!Clock.Resting && Clock.SnoozeRemaining <= 0) Clock.Snooze(); RefreshDisplay(Native.Idle(), Native.Locked()); };
            System.Media.SystemSounds.Asterisk.Play(); r.Show(); r.Activate();
        }
        private void ExitApp() { Exiting = true; Close(); }
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                Exiting = true;
                if (timer != null) timer.Dispose();
                if (tray != null) { tray.Visible = false; tray.Dispose(); }
                if (mini != null) mini.Dispose();
                if (reminder != null) reminder.Dispose();
                if (usageWindow != null) usageWindow.Dispose();
                if (usageMonitor != null) usageMonitor.Dispose();
                if (usageConnection != null) usageConnection.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    internal static class Tests
    {
        private static void Equal(double value, double expected, string name)
        {
            if (Math.Abs(value - expected) > 0.00001) throw new Exception(name + ": " + value + " != " + expected);
        }
        internal static int Run()
        {
            try
            {
                Equal(UsageClock.Count(1, 0, 120, false, false), 1, "active");
                Equal(UsageClock.Count(1, 125, 120, false, false), 0, "idle");
                Equal(UsageClock.Count(1, 119.5, 120, false, false), 0.5, "idle boundary");
                Equal(UsageClock.Count(1, 0, 120, true, false), 0, "locked");
                Equal(UsageClock.Count(1, 0, 120, false, true), 0, "paused");
                Equal(UsageClock.Count(600, 0, 120, false, false), 0, "sleep gap");
                DateTime today = DateTime.Now;
                DateTime utc = DateTime.UtcNow;
                var clock = new UsageClock(new SavedState { cycle = 1799, date = today.ToString("yyyy-MM-dd") }, () => utc);
                clock.Step(1, 0, false, today);
                if (!clock.Due) throw new Exception("reminder threshold");
                clock.Snooze(); clock.Step(1, 0, false, today); Equal(clock.Remaining, 299, "snooze uses active time");
                clock.Step(1, 130, false, today); Equal(clock.Remaining, 299, "snooze idle pause");
                clock.StartRest(); Equal(clock.Remaining, 300, "five-minute break starts");
                utc = utc.AddSeconds(120); clock.Step(120, 500, false, today);
                Equal(clock.RestRemaining, 180, "no input does not pause a break");
                utc = utc.AddSeconds(60); clock.Step(60, 560, true, today);
                Equal(clock.RestRemaining, 120, "locked screen does not pause a break");
                clock.Paused = true;
                utc = utc.AddSeconds(30); clock.Step(30, 590, true, today);
                Equal(clock.RestRemaining, 90, "work pause does not pause a break");
                utc = utc.AddSeconds(600); clock.Step(600, 1190, true, today);
                Equal(clock.State.cycle, 0, "rest resets cycle"); Equal(clock.State.breaks, 1, "rest recorded");
                if (clock.Resting) throw new Exception("Break must complete after sleep");
                clock.Step(1, 1200, true, today); Equal(clock.State.breaks, 1, "break completion counted once");
                Equal(clock.State.total, 2, "break time is not computer usage");
                clock.Paused = false;
                clock.State.cycle = 43; clock.Step(1, 0, false, today.AddDays(1));
                Equal(clock.State.total, 1, "midnight daily reset"); Equal(clock.State.cycle, 44, "midnight cycle preserved");
                if (UsageClock.Format(1799.1) != "30:00" || UsageClock.Format(59.1) != "01:00") throw new Exception("countdown formatting");
                var json = new JavaScriptSerializer();
                Equal(json.Deserialize<SavedState>(json.Serialize(clock.State)).cycle, 44, "state persistence");
                if (Native.Idle() < 0) throw new Exception("native idle"); Native.Locked();
                QuotaTests.Run();
                UsageUpdateTests.Run();
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "test-result.txt"), "PASS: timer rules, quota parsing, no idle polling, completion-only updates, partial records, deduplication and live completion notifications.");
                return 0;
            }
            catch (Exception ex)
            {
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "test-result.txt"), "FAIL: " + ex);
                return 1;
            }
        }
    }
}
