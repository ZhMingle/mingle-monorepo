import AppKit
import CoreGraphics

@MainActor final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    let clock: UsageClock
    let saveURL: URL
    let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 860, height: 738), styleMask: [.titled, .closable, .miniaturizable], backing: .buffered, defer: false)
    let panel = NSPanel(contentRect: NSRect(x: 70, y: 100, width: 220, height: 102), styleMask: [.titled, .utilityWindow, .nonactivatingPanel, .fullSizeContentView], backing: .buffered, defer: false)
    var status: NSStatusItem!
    var timer: Timer?
    var last = ProcessInfo.processInfo.systemUptime
    var sleeping = false
    var sessionInactive = false
    var reminder: NSAlert?
    var reminderKind = ""
    let countdown = NSTextField(labelWithString: "30:00")
    let detail = NSTextField(wrappingLabelWithString: "")
    let mini = NSTextField(labelWithString: "30:00")
    let miniUsage = NSTextField(wrappingLabelWithString: "Codex: connecting…")
    let usage = NSTextField(wrappingLabelWithString: "Codex: connecting…")
    var usageText = ""
    var compactUsageText = ""
    var usageDate: Date?
    let client = UsageClient()
    let queue = DispatchQueue(label: "rise.usage")
    var loading = false
    var nextRefresh = Date.distantPast
    let action = NSButton(title: "Pause", target: nil, action: nil)
    let miniAction = NSButton(title: "Pause", target: nil, action: nil)
    init(testMode: Bool) {
        saveURL = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Application Support/MingleActivityReminder/macos-v1.json")
        if !testMode, let data = try? Data(contentsOf: saveURL), let state = try? JSONDecoder().decode(SavedState.self, from: data) { clock = UsageClock(state) }
        else { clock = UsageClock() }
        super.init()
    }
    let dial = TimerDial()
    let caption = NSTextField(labelWithString: "Until your next break")
    let totalMetric = NSTextField(labelWithString: "0 min")
    let cycleMetric = NSTextField(labelWithString: "00:00")
    let breaksMetric = NSTextField(labelWithString: "0")
    let breakAction = NSButton(title: "Take a break", target: nil, action: nil)
    func label(_ text: String, size: CGFloat = 13, color: NSColor = Theme.white, weight: NSFont.Weight = .regular) -> NSTextField {
        let field = NSTextField(labelWithString: text); Theme.text(field, size: size, color: color, weight: weight); return field
    }
    @discardableResult func place(_ view: NSView, _ host: NSView, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> NSView {
        view.frame = NSRect(x: x, y: y, width: w, height: h); host.addSubview(view); return view
    }
    func button(_ title: String, _ selector: Selector, primary: Bool = false) -> NSButton {
        let button = NSButton(title: title, target: self, action: selector); Theme.button(button, primary: primary); return button
    }
    func applicationDidFinishLaunching(_ notification: Notification) {
        window.title = "Rise"; window.center(); window.delegate = self; window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: .darkAqua); window.backgroundColor = Theme.background; window.titlebarAppearsTransparent = true
        let root = Surface(NSRect(x: 0, y: 0, width: 860, height: 738), color: Theme.background); window.contentView = root
        place(label("Rise", size: 32, color: Theme.mint, weight: .semibold), root, 32, 22, 180, 42)
        place(label("A little movement. A clearer mind.", color: Theme.muted), root, 34, 68, 360, 22)
        place(button("Use floating timer", #selector(useFloating)), root, 651, 33, 177, 38)
        place(label("●  LOCAL ACTIVITY", size: 10, color: Theme.muted, weight: .medium), root, 491, 46, 150, 18)
        let timerCard = Surface(NSRect(x: 32, y: 112, width: 490, height: 354), color: Theme.card, radius: 18); root.addSubview(timerCard)
        Theme.text(detail, size: 12, color: Theme.mint); place(detail, timerCard, 24, 20, 442, 22)
        place(dial, timerCard, 129, 47, 232, 232)
        Theme.text(countdown, size: 51, weight: .light); countdown.font = .monospacedDigitSystemFont(ofSize: 51, weight: .light); countdown.alignment = .center
        place(countdown, timerCard, 130, 123, 230, 64)
        Theme.text(caption, size: 11, color: Theme.muted); caption.alignment = .center; place(caption, timerCard, 135, 191, 220, 24)
        action.target = self; action.action = #selector(toggle); Theme.button(action)
        breakAction.target = self; breakAction.action = #selector(takeBreak); Theme.button(breakAction, primary: true)
        place(action, timerCard, 24, 292, 210, 40); place(breakAction, timerCard, 246, 292, 220, 40)
        let settings = Surface(NSRect(x: 542, y: 112, width: 286, height: 354), color: Theme.card, radius: 18); root.addSubview(settings)
        place(label("Your break rhythm", size: 18, weight: .medium), settings, 22, 20, 244, 28)
        place(label("Remind me after", color: Theme.muted), settings, 22, 67, 244, 22)
        let intervals = NSPopUpButton(); intervals.addItems(withTitles: ["15 minutes", "30 minutes", "45 minutes", "60 minutes"]); intervals.selectItem(withTitle: "\(clock.state.interval) minutes"); intervals.target = self; intervals.action = #selector(intervalChanged(_:)); intervals.controlSize = .large
        place(intervals, settings, 19, 94, 248, 34)
        place(label("Pause when idle for", color: Theme.muted), settings, 22, 147, 244, 22)
        let idle = NSPopUpButton(); idle.addItems(withTitles: ["1 minute", "2 minutes", "5 minutes"]); idle.selectItem(at: [60,120,300].firstIndex(of: clock.state.idle) ?? 1); idle.target = self; idle.action = #selector(idleChanged(_:)); idle.controlSize = .large
        place(idle, settings, 19, 174, 248, 34)
        let floating = NSButton(checkboxWithTitle: "Show floating timer", target: self, action: #selector(floatingChanged(_:))); floating.state = clock.state.floating ? .on : .off; floating.contentTintColor = Theme.mint
        place(floating, settings, 22, 234, 244, 24)
        place(button("Preview reminder", #selector(preview)), settings, 22, 292, 242, 40)
        for (index, entry) in [("Active time today", totalMetric), ("Time this session", cycleMetric), ("Breaks completed", breaksMetric)].enumerated() {
            let card = Surface(NSRect(x: 32 + CGFloat(index) * 272, y: 484, width: 252, height: 92), color: Theme.card, radius: 14); root.addSubview(card)
            place(label(entry.0, size: 12, color: Theme.muted), card, 20, 15, 212, 20)
            Theme.text(entry.1, size: 27, weight: .medium); place(entry.1, card, 18, 42, 218, 36)
        }
        let quota = Surface(NSRect(x: 32, y: 594, width: 796, height: 94), color: Theme.card, radius: 14); root.addSubview(quota)
        place(label("CODEX ALLOWANCE", size: 10, color: Theme.muted, weight: .semibold), quota, 20, 13, 200, 16)
        Theme.text(usage, size: 11, color: Theme.mint); usage.maximumNumberOfLines = 3; usage.lineBreakMode = .byTruncatingTail
        place(usage, quota, 20, 33, 512, 55)
        place(button("↻ Refresh", #selector(refresh)), quota, 546, 28, 101, 36)
        place(button("Choose CLI…", #selector(chooseCLI)), quota, 657, 28, 119, 36)
        place(label("Auto-pauses when locked or idle  ·  Close the window to keep Rise in the menu bar", size: 11, color: Theme.muted), root, 34, 706, 790, 18)
        panel.title = "Rise"; panel.titleVisibility = .hidden; panel.level = .floating; panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]; panel.isMovableByWindowBackground = true; panel.setFrameAutosaveName("RiseFloating"); panel.appearance = NSAppearance(named: .darkAqua); panel.backgroundColor = Theme.card; panel.titlebarAppearsTransparent = true
        let miniRoot = Surface(NSRect(x: 0, y: 0, width: 220, height: 102), color: Theme.card); panel.contentView = miniRoot; panel.setContentSize(NSSize(width: 220, height: 102))
        Theme.text(mini, size: 34, color: Theme.mint, weight: .light); mini.font = .monospacedDigitSystemFont(ofSize: 34, weight: .light); place(mini, miniRoot, 108, 8, 100, 43)
        Theme.text(miniUsage, size: 10, color: Theme.muted); miniUsage.maximumNumberOfLines = 3; miniUsage.lineBreakMode = .byTruncatingTail; place(miniUsage, miniRoot, 12, 12, 92, 40)
        let openMini = button("Open app", #selector(show)); openMini.font = .systemFont(ofSize: 11, weight: .medium); place(openMini, miniRoot, 12, 60, 92, 30)
        miniAction.target = self; miniAction.action = #selector(miniToggle); Theme.button(miniAction); miniAction.font = .systemFont(ofSize: 11, weight: .medium); place(miniAction, miniRoot, 112, 60, 96, 30)
        status = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        let menu = NSMenu(); menu.addItem(withTitle: "Open Rise", action: #selector(show), keyEquivalent: ""); menu.addItem(withTitle: "Pause / Start session", action: #selector(toggle), keyEquivalent: ""); menu.addItem(.separator()); menu.addItem(withTitle: "Quit Rise", action: #selector(quit), keyEquivalent: "q"); for item in menu.items { item.target = self }; status.menu = menu
        let center = NSWorkspace.shared.notificationCenter
        center.addObserver(self, selector: #selector(willSleep), name: NSWorkspace.willSleepNotification, object: nil)
        center.addObserver(self, selector: #selector(didWake), name: NSWorkspace.didWakeNotification, object: nil)
        center.addObserver(self, selector: #selector(resigned), name: NSWorkspace.sessionDidResignActiveNotification, object: nil)
        center.addObserver(self, selector: #selector(becameActive), name: NSWorkspace.sessionDidBecomeActiveNotification, object: nil)
        DistributedNotificationCenter.default().addObserver(self, selector: #selector(resigned), name: NSNotification.Name("com.apple.screenIsLocked"), object: nil)
        DistributedNotificationCenter.default().addObserver(self, selector: #selector(becameActive), name: NSNotification.Name("com.apple.screenIsUnlocked"), object: nil)
        show(); render(); refresh()
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in MainActor.assumeIsolated { self?.tick() } }
        if CommandLine.arguments.contains("--preview") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                if let bitmap = root.bitmapImageRepForCachingDisplay(in: root.bounds) {
                    root.cacheDisplay(in: root.bounds, to: bitmap)
                    if let data = bitmap.representation(using: .png, properties: [:]) { try? data.write(to: URL(fileURLWithPath: "/private/tmp/rise-preview.png")) }
                }
                if let bitmap = miniRoot.bitmapImageRepForCachingDisplay(in: miniRoot.bounds) {
                    miniRoot.cacheDisplay(in: miniRoot.bounds, to: bitmap)
                    if let data = bitmap.representation(using: .png, properties: [:]) { try? data.write(to: URL(fileURLWithPath: "/private/tmp/rise-mini-preview.png")) }
                }
                NSApp.terminate(nil)
            }
        }
        if CommandLine.arguments.contains("--smoke-test") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { print("PASS: native dashboard, floating panel and menu bar initialized"); NSApp.terminate(nil) }
        }
    }
    var locked: Bool {
        let session = CGSessionCopyCurrentDictionary() as? [String: Any]
        return sessionInactive || sleeping || (session?["CGSSessionScreenIsLocked"] as? Bool ?? false)
    }
    func tick() {
        let uptime = ProcessInfo.processInfo.systemUptime, now = Date()
        clock.step(elapsed: uptime - last, idle: CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null), locked: locked, now: now); last = uptime
        render()
        if !locked && reminder == nil {
            if clock.state.awaitingStart && reminderKind != "start" { prompt(start: true) }
            else if clock.due { prompt(start: false) }
        }
        if now >= nextRefresh { save(); refresh() }
    }
    func render() {
        let text = UsageClock.format(clock.remaining(Date())); countdown.stringValue = text; mini.stringValue = text; status?.button?.title = "↑ \(text)"
        let now = Date(), idle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null)
        let autoIdle = clock.isIdle(idle, now: now)
        let state = clock.restEnd != nil ? "Take a five-minute break" : clock.state.awaitingStart ? "Ready when you are" : clock.paused ? "Paused" : locked ? "Screen inactive · auto-paused" : autoIdle ? "Away · auto-paused" : "Tracking active time"
        detail.stringValue = "●  " + state
        totalMetric.stringValue = "\(Int(clock.state.total / 60)) min"
        cycleMetric.stringValue = UsageClock.format(clock.state.cycle); breaksMetric.stringValue = "\(clock.state.breaks)"
        dial.progress = clock.restEnd != nil ? 1 - clock.remaining(Date()) / 300 : clock.state.cycle / Double(clock.state.interval * 60)
        caption.stringValue = clock.restEnd != nil ? "Rest your eyes. Move a little." : clock.state.awaitingStart ? "Waiting for your confirmation" : clock.snooze > 0 ? "Until the next reminder" : "Until your next break"
        countdown.setAccessibilityLabel(caption.stringValue + " " + text)
        breakAction.title = clock.restEnd != nil ? "Skip break" : clock.state.awaitingStart ? "Start next session" : "Take a 5-minute break"
        action.title = clock.actionTitle(idle: idle, locked: locked, now: now); miniAction.title = clock.restEnd != nil ? "Skip break" : clock.state.awaitingStart ? "Start session" : action.title
        action.isEnabled = !locked && clock.restEnd == nil; miniAction.isEnabled = !locked
        if clock.state.floating { panel.orderFrontRegardless() } else { panel.orderOut(nil) }
    }
    func save() {
        guard !CommandLine.arguments.contains("--smoke-test"), !CommandLine.arguments.contains("--preview") else { return }
        do { try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true); try JSONEncoder().encode(clock.state).write(to: saveURL, options: .atomic) }
        catch { usage.stringValue = "Could not save settings: \(error.localizedDescription)" }
    }
    @objc func show() { window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true) }
    @objc func toggle() { guard !locked else { return }; clock.toggle(idle: CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null), now: Date(), resumeRequested: action.title == "Resume"); if !clock.state.awaitingStart { reminderKind = "" }; last = ProcessInfo.processInfo.systemUptime; save(); render() }
    @objc func useFloating() { clock.state.floating = true; save(); render(); window.orderOut(nil) }
    @objc func takeBreak() { if clock.restEnd != nil { skip() } else if clock.state.awaitingStart { toggle() } else { clock.rest(Date()); save(); render() } }
    @objc func miniToggle() { if clock.restEnd != nil { skip() } else { toggle() } }
    @objc func skip() { if clock.restEnd != nil || clock.due || clock.snooze > 0 { clock.prepare(); reminderKind = ""; save(); render() } }
    @objc func preview() { if reminder == nil { prompt(start: false) } }
    func prompt(start: Bool) {
        let alert = NSAlert(); reminder = alert; reminderKind = start ? "start" : "break"
        alert.messageText = start ? "Ready for the next session?" : "Time to stand up and move"
        alert.informativeText = start ? "The timer stays stopped until you start." : "Take a five-minute break away from your computer."
        alert.addButton(withTitle: start ? "Start next session" : "Start 5-minute break"); alert.addButton(withTitle: start ? "Later" : "Snooze 5 minutes")
        if !start { alert.addButton(withTitle: "Skip break"); NSSound.beep() }
        show(); alert.window.level = .floating
        alert.beginSheetModal(for: window) { [weak self] response in
            guard let self else { return }; self.reminder = nil
            if start { if response == .alertFirstButtonReturn { self.clock.confirm(Date()); self.reminderKind = "" } }
            else { if response == .alertFirstButtonReturn { self.clock.rest(Date()) } else if response == .alertThirdButtonReturn { self.clock.prepare() } else { self.clock.snooze = 300 }; self.reminderKind = "" }
            self.save(); self.render()
        }
    }
    @objc func intervalChanged(_ sender: NSPopUpButton) { clock.state.interval = [15,30,45,60][sender.indexOfSelectedItem]; save(); render() }
    @objc func idleChanged(_ sender: NSPopUpButton) { clock.state.idle = [60,120,300][sender.indexOfSelectedItem]; save() }
    @objc func floatingChanged(_ sender: NSButton) { clock.state.floating = sender.state == .on; save(); render() }
    @objc func willSleep() { sleeping = true; save() }
    @objc func didWake() { sleeping = false; last = ProcessInfo.processInfo.systemUptime }
    @objc func resigned() { sessionInactive = true }
    @objc func becameActive() { sessionInactive = false; last = ProcessInfo.processInfo.systemUptime }
    @objc func refresh() {
        guard !loading else { return }; loading = true; nextRefresh = Date().addingTimeInterval(15)
        let path = clock.state.codexPath, client = client
        queue.async { [weak self] in
            let result = Result { try client.read(path: path) }
            DispatchQueue.main.async {
                guard let self else { return }; self.loading = false
                switch result {
                case .success(let reading): self.usageText = reading.text; self.compactUsageText = reading.compactText; self.miniUsage.stringValue = reading.compactText; self.usageDate = Date(); self.usage.stringValue = reading.text + "\nUpdated \(Date().formatted(date: .omitted, time: .standard))"
                case .failure(let error): self.miniUsage.stringValue = self.compactUsageText.isEmpty ? "5h: Unavailable\nWeekly: Unavailable" : self.compactUsageText + "\nLast known · refresh failed"; self.usage.stringValue = (self.usageText.isEmpty ? "" : self.usageText + "\nLast known · ") + (error as NSError).domain
                }
            }
        }
    }
    @objc func chooseCLI() {
        let picker = NSOpenPanel(); picker.canChooseDirectories = false; picker.message = "Select the codex executable"
        if picker.runModal() == .OK, let url = picker.url { clock.state.codexPath = url.path; save(); let client = client; queue.async { client.close() }; refresh() }
    }
    @objc func quit() { NSApp.terminate(nil) }
    func windowShouldClose(_ sender: NSWindow) -> Bool { sender.orderOut(nil); return false }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
    func applicationWillTerminate(_ notification: Notification) { save(); timer?.invalidate(); queue.sync { client.close() } }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool { show(); return true }
}

MainActor.assumeIsolated {
    let app = NSApplication.shared
    app.setActivationPolicy(.regular)
    let delegate = AppDelegate(testMode: CommandLine.arguments.contains("--smoke-test") || CommandLine.arguments.contains("--preview"))
    app.delegate = delegate
    withExtendedLifetime(delegate) { app.run() }
}
