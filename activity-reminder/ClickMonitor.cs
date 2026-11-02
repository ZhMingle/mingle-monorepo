using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace Mingle.ActivityReminder
{
    // Passive desktop click notification. No coordinates or activity history are saved.
    internal sealed class ClickMonitor : IDisposable
    {
        private delegate IntPtr MouseProc(int code, IntPtr message, IntPtr data);
        private readonly MouseProc callback;
        private IntPtr hook;
        private bool pending;
        [StructLayout(LayoutKind.Sequential)] private struct Point { public int x, y; }
        [StructLayout(LayoutKind.Sequential)] private struct MouseInfo
        { public Point point; public uint mouseData, flags, time; public UIntPtr extra; }
        [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr SetWindowsHookEx(int id, MouseProc proc, IntPtr module, uint thread);
        [DllImport("user32.dll")] private static extern bool UnhookWindowsHookEx(IntPtr handle);
        [DllImport("user32.dll")] private static extern IntPtr CallNextHookEx(IntPtr handle, int code, IntPtr message, IntPtr data);
        [DllImport("user32.dll")] private static extern IntPtr WindowFromPoint(Point point);
        [DllImport("kernel32.dll", CharSet = CharSet.Auto)] private static extern IntPtr GetModuleHandle(string name);
        internal bool Available { get { return hook != IntPtr.Zero; } }
        internal ClickMonitor()
        {
            callback = OnMouse;
            hook = SetWindowsHookEx(14, callback, GetModuleHandle(null), 0);
        }
        private IntPtr OnMouse(int code, IntPtr message, IntPtr data)
        {
            int kind = message.ToInt32();
            if (code >= 0 && (kind == 0x201 || kind == 0x204 || kind == 0x207 || kind == 0x20B))
            {
                try
                {
                    var info = (MouseInfo)Marshal.PtrToStructure(data, typeof(MouseInfo));
                    Control target = Control.FromChildHandle(WindowFromPoint(info.point));
                    // Rise controls keep their explicit action; pressing Later/Pause must
                    // not also start a session before the button's click handler runs.
                    bool explicitAction = false;
                    for (Control c = target; c != null; c = c.Parent)
                        if (c is ButtonBase || c is ComboBox || c is ToolStrip) { explicitAction = true; break; }
                    if (!explicitAction) pending = true;
                }
                catch (InvalidOperationException) { /* A disappearing window must not interrupt input. */ }
            }
            return CallNextHookEx(hook, code, message, data);
        }
        internal bool Consume() { bool value = pending; pending = false; return value; }
        public void Dispose()
        {
            if (hook != IntPtr.Zero) { UnhookWindowsHookEx(hook); hook = IntPtr.Zero; }
            pending = false;
        }
    }
}
