using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace Mingle.ActivityReminder
{
    // Filesystem notifications provide a local activity signal, not quota values.
    // Session contents and conversation text are never opened by this monitor.
    internal sealed class UsageActivityMonitor : IDisposable
    {
        private readonly FileSystemWatcher watcher;
        internal event Action Changed;
        internal readonly bool Watching;
        internal UsageActivityMonitor(string home)
        {
            string root = Path.Combine(home, "sessions");
            if (!Directory.Exists(root)) return;
            try
            {
                watcher = new FileSystemWatcher(root, "*.jsonl")
                {
                    IncludeSubdirectories = true,
                    NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.FileName,
                    InternalBufferSize = 32768
                };
                watcher.Changed += delegate { Signal(); };
                watcher.Created += delegate { Signal(); };
                watcher.Renamed += delegate { Signal(); };
                watcher.Error += delegate { Signal(); };
                watcher.EnableRaisingEvents = true;
                Watching = true;
            }
            catch { if (watcher != null) watcher.Dispose(); }
        }
        private void Signal() { Action handler = Changed; if (handler != null) handler(); }
        public void Dispose() { if (watcher != null) watcher.Dispose(); }
        internal static string CodexHome
        {
            get
            {
                string configured = Environment.GetEnvironmentVariable("CODEX_HOME");
                return !string.IsNullOrWhiteSpace(configured) ? configured : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".codex");
            }
        }
    }

    // Debounce bursts, retain activity during a request, and never poll while idle.
    internal sealed class UsageUpdateSchedule
    {
        private double first = double.PositiveInfinity, last, notBefore;
        internal bool Pending { get { return !double.IsPositiveInfinity(first); } }
        internal void Signal(double now) { if (!Pending) first = now; last = now; }
        internal bool Ready(double now)
        {
            return Pending && now >= notBefore && (now - last >= 0.8 || now - first >= 3);
        }
        internal void Started(double now) { first = double.PositiveInfinity; notBefore = now + 3; }
        internal void Failed(double now) { Signal(now); notBefore = now + 15; }
    }

    // One persistent, private stdio connection. No listening network port or model turns.
    internal sealed class CodexUsageConnection : IDisposable
    {
        private readonly object gate = new object();
        private readonly Dictionary<int, TaskCompletionSource<Dictionary<string, object>>> pending = new Dictionary<int, TaskCompletionSource<Dictionary<string, object>>>();
        private readonly JavaScriptSerializer json = new JavaScriptSerializer();
        private Process process;
        private int nextId;
        private bool initialized, disposed;
        private readonly string selected;
        internal event Action<QuotaSnapshot> Updated;
        internal event Action Disconnected;
        internal CodexUsageConnection(string selected) { this.selected = selected; }
        private void OnLine(string line)
        {
            if (line == null) { FailPending(); return; }
            Dictionary<string, object> message;
            try { message = QuotaSnapshot.Map(new JavaScriptSerializer().DeserializeObject(line)); } catch { return; }
            object idValue = QuotaSnapshot.Get(message, "id");
            int id;
            if (idValue != null && int.TryParse(Convert.ToString(idValue), out id))
            {
                TaskCompletionSource<Dictionary<string, object>> completion;
                lock (gate) { if (!pending.TryGetValue(id, out completion)) return; pending.Remove(id); }
                if (QuotaSnapshot.Get(message, "error") != null)
                    completion.TrySetException(new InvalidOperationException("Could not read Codex usage. Check your sign-in and network connection; Rise will retry automatically."));
                else completion.TrySetResult(QuotaSnapshot.Map(QuotaSnapshot.Get(message, "result")));
                return;
            }
            if (Convert.ToString(QuotaSnapshot.Get(message, "method")) == "account/rateLimits/updated")
            {
                try
                {
                    QuotaSnapshot snapshot = QuotaSnapshot.Parse(QuotaSnapshot.Map(QuotaSnapshot.Get(message, "params")));
                    Action<QuotaSnapshot> handler = Updated; if (handler != null) handler(snapshot);
                }
                catch { }
            }
        }
        private void FailPending()
        {
            lock (gate)
            {
                foreach (var completion in pending.Values) completion.TrySetException(new IOException("Codex connection closed. Reconnecting automatically."));
                pending.Clear();
            }
            if (!disposed) { Action handler = Disconnected; if (handler != null) handler(); }
        }
        private Dictionary<string, object> Request(string method, object parameters)
        {
            int id = System.Threading.Interlocked.Increment(ref nextId);
            var completion = new TaskCompletionSource<Dictionary<string, object>>();
            lock (gate) pending.Add(id, completion);
            try
            {
                process.StandardInput.WriteLine(json.Serialize(new { method = method, id = id, @params = parameters }));
                process.StandardInput.Flush();
                if (!completion.Task.Wait(25000)) throw new TimeoutException("Codex usage response timed out. Retrying automatically.");
                return completion.Task.GetAwaiter().GetResult();
            }
            catch (AggregateException ex) { throw ex.InnerException ?? ex; }
            finally { lock (gate) pending.Remove(id); }
        }
        internal QuotaSnapshot Read()
        {
            if (disposed) throw new ObjectDisposedException("Codex usage connection");
            if (!initialized)
            {
                string executable = CodexUsageClient.FindExecutable(selected);
                process = new Process
                {
                    StartInfo = new ProcessStartInfo(executable, "app-server")
                    {
                        UseShellExecute = false, CreateNoWindow = true, RedirectStandardInput = true,
                        RedirectStandardOutput = true, RedirectStandardError = true, WorkingDirectory = Path.GetDirectoryName(executable)
                    }
                };
                process.OutputDataReceived += delegate(object sender, DataReceivedEventArgs e) { OnLine(e.Data); };
                process.ErrorDataReceived += delegate { };
                process.Start(); process.BeginOutputReadLine(); process.BeginErrorReadLine();
                Request("initialize", new { clientInfo = new { name = "rise_usage_monitor", title = "Rise Activity Reminder", version = "1.2.0" } });
                process.StandardInput.WriteLine("{\"method\":\"initialized\",\"params\":{}}"); process.StandardInput.Flush();
                initialized = true;
            }
            return QuotaSnapshot.Parse(Request("account/rateLimits/read", null));
        }
        public void Dispose()
        {
            disposed = true;
            if (process != null)
            {
                try { process.StandardInput.Close(); if (!process.WaitForExit(500)) process.Kill(); } catch { }
                process.Dispose(); process = null;
            }
            FailPending();
        }
    }

    internal static class UsageUpdateTests
    {
        internal static void Run()
        {
            var schedule = new UsageUpdateSchedule();
            if (schedule.Ready(1000000)) throw new Exception("Idle monitor must not poll");
            schedule.Signal(1);
            if (schedule.Ready(1.5) || !schedule.Ready(1.9)) throw new Exception("Activity debounce");
            schedule.Started(1.9);
            if (schedule.Ready(1000000)) throw new Exception("No periodic refresh after success");
            schedule.Signal(2); schedule.Signal(3);
            if (schedule.Ready(4) || !schedule.Ready(5)) throw new Exception("Activity while request in flight must be retained");
            schedule.Started(5);
            for (int i = 0; i < 10; i++) schedule.Signal(5 + i * 0.3);
            if (!schedule.Ready(8.1)) throw new Exception("Continuous activity must not starve updates");
            schedule.Started(8.1); schedule.Failed(9);
            if (schedule.Ready(10) || !schedule.Ready(24)) throw new Exception("Failure retry backoff");
            string root = Path.Combine(Path.GetTempPath(), "rise-watch-test-" + Guid.NewGuid().ToString("N"));
            string sessions = Path.Combine(root, "sessions"); Directory.CreateDirectory(sessions);
            try
            {
                using (var changed = new System.Threading.ManualResetEvent(false))
                using (var monitor = new UsageActivityMonitor(root))
                {
                    monitor.Changed += delegate { changed.Set(); };
                    if (!monitor.Watching) throw new Exception("Session watcher initialization");
                    File.WriteAllText(Path.Combine(sessions, "synthetic.jsonl"), "synthetic activity; no conversation content");
                    if (!changed.WaitOne(3000)) throw new Exception("Live filesystem activity event");
                }
            }
            finally { File.Delete(Path.Combine(sessions, "synthetic.jsonl")); Directory.Delete(sessions); Directory.Delete(root); }
        }
    }
}
