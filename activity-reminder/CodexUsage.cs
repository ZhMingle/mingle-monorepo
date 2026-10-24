using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.Drawing;

namespace Mingle.ActivityReminder
{
    internal sealed class QuotaWindow
    {
        internal double? Remaining;
        internal int? Minutes;
        internal long? ResetsAt;
        internal string Period
        {
            get
            {
                if (!Minutes.HasValue) return "Window";
                if (Minutes.Value % 10080 == 0) return (Minutes.Value / 10080) + "w";
                if (Minutes.Value % 1440 == 0) return (Minutes.Value / 1440) + "d";
                if (Minutes.Value % 60 == 0) return (Minutes.Value / 60) + "h";
                return Minutes.Value + "m";
            }
        }
        internal string Percent { get { return Remaining.HasValue ? Remaining.Value.ToString("0.#", CultureInfo.InvariantCulture) + "% left" : "Unavailable"; } }
        internal string Reset
        {
            get
            {
                if (!ResetsAt.HasValue) return "Reset time unavailable";
                try
                {
                    DateTime utc = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddSeconds(ResetsAt.Value);
                    return utc <= DateTime.UtcNow ? "Reset due - refresh to confirm" : "Resets " + utc.ToLocalTime().ToString("MMM d, HH:mm", CultureInfo.InvariantCulture);
                }
                catch { return "Reset time unavailable"; }
            }
        }
        internal string Summary { get { return Period + ": " + Percent; } }
    }

    internal sealed class QuotaBucket
    {
        internal string Id, Name;
        internal QuotaWindow Primary, Secondary;
        internal IEnumerable<QuotaWindow> Windows
        {
            get { if (Primary != null) yield return Primary; if (Secondary != null) yield return Secondary; }
        }
        internal string Summary { get { return string.Join("  |  ", Windows.Select(w => w.Summary).ToArray()); } }
    }

    internal sealed class QuotaSnapshot
    {
        internal readonly List<QuotaBucket> Buckets = new List<QuotaBucket>();
        internal DateTime FetchedUtc = DateTime.UtcNow;
        internal QuotaBucket Main { get { return Buckets.FirstOrDefault(b => b.Id == "codex") ?? Buckets.FirstOrDefault(); } }
        internal static Dictionary<string, object> Map(object value) { return value as Dictionary<string, object>; }
        internal static object Get(Dictionary<string, object> map, string key) { object value; return map != null && map.TryGetValue(key, out value) ? value : null; }
        private static double? Number(object value)
        {
            if (value == null) return null;
            double n;
            return double.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), NumberStyles.Float, CultureInfo.InvariantCulture, out n) && !double.IsNaN(n) && !double.IsInfinity(n) ? (double?)n : null;
        }
        private static QuotaWindow Window(object value)
        {
            var map = Map(value); if (map == null) return null;
            double? used = Number(Get(map, "usedPercent")), minutes = Number(Get(map, "windowDurationMins")), reset = Number(Get(map, "resetsAt"));
            return new QuotaWindow
            {
                Remaining = used.HasValue ? (double?)Math.Max(0, Math.Min(100, 100 - used.Value)) : null,
                Minutes = minutes.HasValue && minutes > 0 && minutes <= int.MaxValue ? (int?)minutes.Value : null,
                ResetsAt = reset.HasValue && reset >= 0 && reset <= 253402300799 ? (long?)reset.Value : null
            };
        }
        private static QuotaBucket Bucket(object value, string id)
        {
            var map = Map(value); if (map == null) return null;
            return new QuotaBucket
            {
                Id = Convert.ToString(Get(map, "limitId") ?? id), Name = Convert.ToString(Get(map, "limitName") ?? Get(map, "limitId") ?? id),
                Primary = Window(Get(map, "primary")), Secondary = Window(Get(map, "secondary"))
            };
        }
        internal static QuotaSnapshot Parse(Dictionary<string, object> result)
        {
            var snapshot = new QuotaSnapshot();
            var buckets = Map(Get(result, "rateLimitsByLimitId"));
            if (buckets != null)
                foreach (var pair in buckets.OrderBy(p => p.Key))
                {
                    var bucket = Bucket(pair.Value, pair.Key);
                    if (bucket != null && bucket.Windows.Any()) snapshot.Buckets.Add(bucket);
                }
            if (snapshot.Buckets.Count == 0)
            {
                var bucket = Bucket(Get(result, "rateLimits"), "codex");
                if (bucket != null && bucket.Windows.Any()) snapshot.Buckets.Add(bucket);
            }
            if (snapshot.Buckets.Count == 0) throw new InvalidOperationException("No subscription usage windows returned. Sign in to Codex with your ChatGPT account.");
            return snapshot;
        }
    }

    internal static class CodexUsageClient
    {
        internal static string FindExecutable(string selected)
        {
            if (!string.IsNullOrWhiteSpace(selected) && File.Exists(selected)) return selected;
            foreach (string entry in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator))
            {
                try { string candidate = Path.Combine(entry.Trim('"'), "codex.exe"); if (File.Exists(candidate)) return candidate; } catch { }
            }
            string root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OpenAI", "Codex", "bin");
            if (Directory.Exists(root))
            {
                foreach (var dir in new DirectoryInfo(root).GetDirectories().OrderByDescending(d => d.LastWriteTimeUtc))
                {
                    string candidate = Path.Combine(dir.FullName, "codex.exe"); if (File.Exists(candidate)) return candidate;
                }
            }
            throw new FileNotFoundException("Codex CLI not found. Choose codex.exe to connect your existing Codex sign-in.");
        }
        internal static int LiveTest()
        {
            string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "quota-test-result.txt");
            try
            {
                using (var connection = new CodexUsageConnection(null))
                {
                    connection.Read();
                    var snapshot = connection.Read();
                    File.WriteAllText(path, "PASS: persistent Codex connection and repeat usage reads at " + DateTime.Now.ToString("s") + Environment.NewLine + string.Join(Environment.NewLine, snapshot.Buckets.Select(b => b.Name + ": " + b.Summary).ToArray()));
                }
                return 0;
            }
            catch (Exception ex) { File.WriteAllText(path, "FAIL: " + ex.Message); return 1; }
        }
    }

    internal static class QuotaTests
    {
        internal static void Run()
        {
            var json = new JavaScriptSerializer();
            Func<string, QuotaSnapshot> parse = value => QuotaSnapshot.Parse(QuotaSnapshot.Map(json.DeserializeObject(value)));
            var snapshot = parse("{\"rateLimits\":{\"primary\":{\"usedPercent\":99}},\"rateLimitsByLimitId\":{\"codex\":{\"primary\":{\"usedPercent\":5,\"windowDurationMins\":300},\"secondary\":{\"usedPercent\":6,\"windowDurationMins\":10080}}}}");
            if (snapshot.Main.Primary.Remaining != 95 || snapshot.Main.Secondary.Remaining != 94) throw new Exception("Quota remaining percentage or multi-bucket preference");
            if (snapshot.Main.Primary.Period != "5h" || snapshot.Main.Secondary.Period != "1w") throw new Exception("Quota period labels");
            snapshot = parse("{\"rateLimits\":{\"primary\":{\"usedPercent\":null},\"secondary\":null}}");
            if (snapshot.Main.Primary.Remaining != null || snapshot.Main.Primary.Percent != "Unavailable" || snapshot.Main.Secondary != null) throw new Exception("Missing quota is not zero");
            if (snapshot.Main.Primary.Reset != "Reset time unavailable") throw new Exception("Missing reset time");
            snapshot = parse("{\"rateLimits\":{\"primary\":{\"usedPercent\":130},\"secondary\":{\"usedPercent\":-10}}}");
            if (snapshot.Main.Primary.Remaining != 0 || snapshot.Main.Secondary.Remaining != 100) throw new Exception("Quota percentage bounds");
            snapshot = parse("{\"rateLimitsByLimitId\":{\"extra\":{\"primary\":{\"usedPercent\":20}},\"codex\":{\"primary\":{\"usedPercent\":30}}}}");
            if (snapshot.Buckets.Count != 2 || snapshot.Main.Id != "codex") throw new Exception("Multiple quota buckets");
            bool rejected = false;
            try { parse("{\"rateLimits\":null}"); } catch (InvalidOperationException) { rejected = true; }
            if (!rejected) throw new Exception("Empty usage response");
        }
    }

    internal sealed class UsageWindow : Form
    {
        private readonly MainWindow main;
        private readonly Label status;
        private readonly FlowLayoutPanel rows;
        private readonly Button refresh;
        internal UsageWindow(MainWindow main)
        {
            this.main = main; Text = "Rise - Codex Usage"; ClientSize = new Size(660, 510);
            AutoScaleMode = AutoScaleMode.Dpi; StartPosition = FormStartPosition.CenterParent;
            BackColor = Theme.Bg; ForeColor = Theme.White; Icon = main.Icon; MinimumSize = Size;
            Theme.Label(this, "Codex usage remaining", 26, 22, 470, 42, 22, Theme.Mint);
            status = Theme.Label(this, "Checking your existing Codex sign-in...", 28, 76, 600, 48, 10, Theme.Muted);
            rows = new FlowLayoutPanel { Location = new Point(26, 136), Size = new Size(608, 250), FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right };
            Controls.Add(rows);
            refresh = Theme.Button(this, "Refresh now", 26, 404, 180, true, main.RefreshQuota);
            refresh.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            var choose = Theme.Button(this, "Choose Codex CLI", 224, 404, 180, false, delegate
            {
                using (var picker = new OpenFileDialog { Filter = "Codex CLI (codex.exe)|codex.exe", Title = "Select the installed Codex CLI" })
                    if (picker.ShowDialog(this) == DialogResult.OK) main.SetCodexPath(picker.FileName);
            });
            choose.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            var note = Theme.Label(this, "Updates after each completed Codex task. Reset times use your local timezone.", 28, 466, 600, 28, 9, Theme.Muted);
            note.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            RefreshData();
        }
        internal void RefreshData()
        {
            refresh.Enabled = !main.QuotaLoading;
            status.Text = main.QuotaStatus;
            rows.SuspendLayout();
            while (rows.Controls.Count > 0) { Control c = rows.Controls[0]; rows.Controls.RemoveAt(0); c.Dispose(); }
            if (main.Quota != null)
                foreach (QuotaBucket bucket in main.Quota.Buckets)
                    foreach (QuotaWindow window in bucket.Windows)
                    {
                        Panel panel = new Panel { Size = new Size(580, 92), BackColor = Theme.Card, Margin = new Padding(0, 0, 0, 12) };
                        Theme.Label(panel, bucket.Name + " / " + window.Period, 16, 12, 250, 24, 10, Theme.Muted);
                        Theme.Label(panel, window.Percent, 16, 40, 250, 40, 21, Theme.Mint);
                        Theme.Label(panel, window.Reset, 282, 38, 285, 44, 10, Theme.White);
                        rows.Controls.Add(panel);
                    }
            rows.ResumeLayout();
        }
    }
}
