using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace Mingle.ActivityReminder
{
    // Only lifecycle records appended after startup can trigger an automatic refresh.
    internal sealed class TaskCompletionReader
    {
        private readonly System.Text.StringBuilder line = new System.Text.StringBuilder();
        private readonly System.Text.Decoder decoder = System.Text.Encoding.UTF8.GetDecoder();
        private readonly HashSet<string> seen = new HashSet<string>();
        private bool skipLine;
        internal int Consume(byte[] data, int count)
        {
            char[] chars = new char[System.Text.Encoding.UTF8.GetMaxCharCount(count)];
            int length = decoder.GetChars(data, 0, count, chars, 0, false), completed = 0;
            for (int i = 0; i < length; i++)
            {
                if (chars[i] == '\n')
                {
                    if (!skipLine && IsCompletion(line.ToString())) completed++;
                    line.Clear(); skipLine = false;
                }
                else if (!skipLine)
                {
                    if (line.Length >= 2 * 1024 * 1024) { line.Clear(); skipLine = true; }
                    else line.Append(chars[i]);
                }
            }
            return completed;
        }
        private bool IsCompletion(string record)
        {
            // Usage records arrive during a turn, before its completion record.
            if (record.IndexOf("task_complete", StringComparison.Ordinal) < 0 && record.IndexOf("turn_aborted", StringComparison.Ordinal) < 0 && record.IndexOf("rate_limits", StringComparison.Ordinal) < 0) return false;
            try
            {
                var json = new JavaScriptSerializer { MaxJsonLength = 2 * 1024 * 1024 };
                var message = QuotaSnapshot.Map(json.DeserializeObject(record));
                if (Convert.ToString(QuotaSnapshot.Get(message, "type")) != "event_msg") return false;
                var payload = QuotaSnapshot.Map(QuotaSnapshot.Get(message, "payload"));
                string kind = Convert.ToString(QuotaSnapshot.Get(payload, "type"));
                if (kind == "token_count") return QuotaSnapshot.Map(QuotaSnapshot.Get(payload, "rate_limits")) != null;
                if (kind != "task_complete" && kind != "turn_aborted") return false;
                string id = Convert.ToString(QuotaSnapshot.Get(payload, "turn_id"));
                string root = Convert.ToString(QuotaSnapshot.Get(payload, "root_turn_id"));
                if (!string.IsNullOrEmpty(root) && root != id) return false;
                if (string.IsNullOrEmpty(id)) return false;
                if (seen.Count > 2048) seen.Clear();
                return seen.Add(id);
            }
            catch { return false; }
        }
    }

    internal sealed class UsageActivityMonitor : IDisposable
    {
        private sealed class Cursor
        {
            internal long Offset;
            internal TaskCompletionReader Reader = new TaskCompletionReader();
        }
        private readonly object gate = new object();
        private readonly Dictionary<string, Cursor> cursors = new Dictionary<string, Cursor>(StringComparer.OrdinalIgnoreCase);
        private readonly FileSystemWatcher watcher;
        private bool disposed;
        internal event Action Changed;
        internal readonly bool Watching;
        internal UsageActivityMonitor(string home)
        {
            string root = Path.Combine(home, "sessions");
            if (!Directory.Exists(root)) return;
            try
            {
                // Record existing lengths only; never replay historical completions.
                foreach (string path in Directory.EnumerateFiles(root, "*.jsonl", SearchOption.AllDirectories))
                    try { cursors[path] = new Cursor { Offset = new FileInfo(path).Length }; } catch { }
                watcher = new FileSystemWatcher(root, "*.jsonl")
                {
                    IncludeSubdirectories = true,
                    NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.FileName,
                    InternalBufferSize = 32768
                };
                watcher.Changed += delegate(object sender, FileSystemEventArgs e) { ReadAppend(e.FullPath); };
                watcher.Created += delegate(object sender, FileSystemEventArgs e) { ReadAppend(e.FullPath); };
                watcher.Renamed += delegate(object sender, RenamedEventArgs e)
                {
                    lock (gate) { Cursor cursor; if (cursors.TryGetValue(e.OldFullPath, out cursor)) { cursors.Remove(e.OldFullPath); cursors[e.FullPath] = cursor; } }
                    ReadAppend(e.FullPath);
                };
                watcher.Error += delegate { Rescan(root); };
                watcher.EnableRaisingEvents = true;
                Watching = true;
                Rescan(root);
            }
            catch { if (watcher != null) watcher.Dispose(); }
        }
        private void Rescan(string root)
        {
            try { foreach (string path in Directory.EnumerateFiles(root, "*.jsonl", SearchOption.AllDirectories)) ReadAppend(path); } catch { }
        }
        private void ReadAppend(string path)
        {
            int completions = 0;
            lock (gate)
            {
                if (disposed) return;
                try
                {
                    using (var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
                    {
                        Cursor cursor;
                        if (!cursors.TryGetValue(path, out cursor)) { cursor = new Cursor(); cursors[path] = cursor; }
                        if (file.Length < cursor.Offset) { cursor.Offset = 0; cursor.Reader = new TaskCompletionReader(); }
                        file.Position = cursor.Offset;
                        byte[] buffer = new byte[32768]; int count;
                        while ((count = file.Read(buffer, 0, buffer.Length)) > 0) completions += cursor.Reader.Consume(buffer, count);
                        cursor.Offset = file.Position;
                    }
                }
                catch (IOException) { }
                catch (UnauthorizedAccessException) { }
            }
            Action handler = Changed;
            if (completions > 0 && handler != null && !disposed) handler();
        }
        public void Dispose() { lock (gate) disposed = true; if (watcher != null) watcher.Dispose(); }
        internal static string CodexHome
        {
            get
            {
                string configured = Environment.GetEnvironmentVariable("CODEX_HOME");
                return !string.IsNullOrWhiteSpace(configured) ? configured : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".codex");
            }
        }
    }

    // Coalesce live usage/completion events; poll even without local activity.
    internal sealed class UsageUpdateSchedule
    {
        private double first = double.PositiveInfinity, last, notBefore, nextPoll = 15;
        internal bool Pending { get { return !double.IsPositiveInfinity(first); } }
        internal void Signal(double now) { if (!Pending) first = now; last = now; }
        internal bool Ready(double now)
        {
            return now >= notBefore && (now >= nextPoll || (Pending && (now - last >= 0.8 || now - first >= 3)));
        }
        internal void Started(double now) { first = double.PositiveInfinity; notBefore = now + 3; nextPoll = now + 15; }
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
        internal bool IsAlive
        {
            get { try { return !disposed && (process == null || !process.HasExited); } catch { return false; } }
        }
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
                    completion.TrySetException(new InvalidOperationException("Could not read Codex usage. Check your connection. Rise will try again on the next automatic refresh."));
                else completion.TrySetResult(QuotaSnapshot.Map(QuotaSnapshot.Get(message, "result")));
                return;
            }
            // This private connection runs no turns; session usage events and periodic reads keep the UI current.
        }
        private void FailPending()
        {
            lock (gate)
            {
                foreach (var completion in pending.Values) completion.TrySetException(new IOException("Codex connection closed. Will reconnect on the next automatic refresh."));
                pending.Clear();
            }
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
                if (!completion.Task.Wait(25000)) throw new TimeoutException("Codex usage request timed out. Will retry on the next automatic refresh.");
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
            if (schedule.Ready(14.9) || !schedule.Ready(15)) throw new Exception("Periodic usage refresh deadline");
            schedule.Signal(1);
            if (schedule.Ready(1.5) || !schedule.Ready(1.9)) throw new Exception("Activity debounce");
            schedule.Started(1.9);
            if (schedule.Ready(16.8) || !schedule.Ready(16.9)) throw new Exception("Periodic refresh after success or failure");
            schedule.Signal(2); schedule.Signal(3);
            if (schedule.Ready(4) || !schedule.Ready(5)) throw new Exception("Activity while request in flight must be retained");
            schedule.Started(5);
            for (int i = 0; i < 10; i++) schedule.Signal(5 + i * 0.3);
            if (!schedule.Ready(8.1)) throw new Exception("Continuous activity must not starve updates");
            var reader = new TaskCompletionReader();
            Func<string, int> consume = value => { byte[] data = System.Text.Encoding.UTF8.GetBytes(value); return reader.Consume(data, data.Length); };
            if (consume("{\"type\":\"event_msg\",\"payload\":{\"type\":\"task_started\",\"turn_id\":\"a\"}}\n") != 0) throw new Exception("Task start must not refresh");
            if (consume("{\"type\":\"event_msg\",\"payload\":{\"type\":\"token_count\"}}\n") != 0) throw new Exception("Thinking/token usage must not refresh");
            if (consume("{\"type\":\"event_msg\",\"payload\":{\"type\":\"token_count\",\"rate_limits\":{\"primary\":{\"used_percent\":12}}}}\n") != 1) throw new Exception("Mid-turn quota event must refresh");
            if (consume("{\"type\":\"event_msg\",\"payload\":{\"type\":\"item_completed\"}}\n") != 0) throw new Exception("Tool completion must not refresh");
            if (consume("{\"type\":\"response_item\",\"payload\":{\"type\":\"task_complete\",\"turn_id\":\"fake\"}}\n") != 0) throw new Exception("Only lifecycle events count");
            string completion = "{\"type\":\"event_msg\",\"payload\":{\"type\":\"task_complete\",\"turn_id\":\"a\",\"root_turn_id\":\"a\"}}";
            if (consume(completion.Substring(0, 50)) != 0 || consume(completion.Substring(50)) != 0 || consume("\n") != 1) throw new Exception("Partial completion record handling");
            if (consume(completion + "\n") != 0) throw new Exception("Duplicate task completion");
            if (consume("{\"type\":\"event_msg\",\"payload\":{\"type\":\"task_complete\",\"turn_id\":\"child\",\"root_turn_id\":\"a\"}}\n") != 0) throw new Exception("Subtask is not a root task completion");
            if (consume("{\"type\":\"event_msg\",\"payload\":{\"type\":\"turn_aborted\",\"turn_id\":\"b\"}}\n") != 1) throw new Exception("Stopped task completion");
            string root = Path.Combine(Path.GetTempPath(), "rise-watch-test-" + Guid.NewGuid().ToString("N"));
            string sessions = Path.Combine(root, "sessions"); Directory.CreateDirectory(sessions);
            string synthetic = Path.Combine(sessions, "synthetic.jsonl");
            File.WriteAllText(synthetic, completion + "\n");
            try
            {
                using (var changed = new System.Threading.ManualResetEvent(false))
                using (var monitor = new UsageActivityMonitor(root))
                {
                    monitor.Changed += delegate { changed.Set(); };
                    if (!monitor.Watching) throw new Exception("Session watcher initialization");
                    File.AppendAllText(synthetic, "{\"type\":\"event_msg\",\"payload\":{\"type\":\"token_count\"}}\n");
                    if (changed.WaitOne(200)) throw new Exception("Historical completions and live token events must not refresh");
                    File.AppendAllText(synthetic, completion.Replace("\"a\"", "\"new-task\"") + "\n");
                    if (!changed.WaitOne(3000)) throw new Exception("Live task completion event");
                    changed.Reset();
                    File.AppendAllText(synthetic, "{\"type\":\"event_msg\",\"payload\":{\"type\":\"token_count\"}}\n");
                    if (changed.WaitOne(200)) throw new Exception("Completion must not be replayed on the next file change");
                }
            }
            finally { File.Delete(Path.Combine(sessions, "synthetic.jsonl")); Directory.Delete(sessions); Directory.Delete(root); }
        }
    }
}
