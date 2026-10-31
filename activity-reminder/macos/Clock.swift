import Foundation

struct SavedState: Codable {
    var interval = 30
    var idle = 120
    var total: Double = 0
    var cycle: Double = 0
    var breaks = 0
    var date = Calendar.current.startOfDay(for: Date())
    var floating = true
    var awaitingStart = false
    var codexPath = ""
}

final class UsageClock {
    var state: SavedState
    var paused = false
    var restEnd: Date?
    var started: Date?
    var snooze: Double = 0
    init(_ state: SavedState = SavedState()) { self.state = state }
    func remaining(_ now: Date) -> Double {
        if let end = restEnd { return max(0, end.timeIntervalSince(now)) }
        return snooze > 0 ? snooze : max(0, Double(state.interval * 60) - state.cycle)
    }
    var due: Bool { restEnd == nil && !state.awaitingStart && !paused && state.cycle >= Double(state.interval * 60) && snooze <= 0 }
    func step(elapsed: Double, idle: Double, locked: Bool, now: Date) {
        let day = Calendar.current.startOfDay(for: now)
        if state.date != day { state.date = day; state.total = 0; state.breaks = 0 }
        if let end = restEnd {
            if now >= end { state.breaks += 1; prepare() }
            return
        }
        guard !paused, !locked, !state.awaitingStart, elapsed > 0, elapsed <= 5, idle.isFinite else { return }
        let effectiveIdle = effectiveIdle(idle, now: now)
        let used = max(0, min(elapsed, Double(state.idle) - effectiveIdle))
        state.total += used; state.cycle += used; snooze = max(0, snooze - used)
    }
    func effectiveIdle(_ idle: Double, now: Date) -> Double {
        started.map { min(idle, max(0, now.timeIntervalSince($0))) } ?? idle
    }
    func isIdle(_ idle: Double, now: Date) -> Bool { effectiveIdle(idle, now: now) >= Double(state.idle) }
    func toggle(idle: Double, now: Date, resumeRequested: Bool = false) {
        guard restEnd == nil else { return }
        if state.awaitingStart { confirm(now) }
        else if resumeRequested || paused || isIdle(idle, now: now) { paused = false; started = now }
        else { paused = true }
    }
    func actionTitle(idle: Double, locked: Bool, now: Date) -> String {
        if restEnd != nil { return "On a break" }
        if state.awaitingStart { return "Start next session" }
        return paused || locked || isIdle(idle, now: now) ? "Resume" : "Pause"
    }
    func rest(_ now: Date) { restEnd = now.addingTimeInterval(300); state.awaitingStart = false; snooze = 0 }
    func prepare() { restEnd = nil; state.cycle = 0; snooze = 0; paused = false; state.awaitingStart = true; started = nil }
    func confirm(_ now: Date) { guard state.awaitingStart else { return }; state.awaitingStart = false; paused = false; started = now }
    static func format(_ seconds: Double) -> String { let n = Int(ceil(max(0, seconds))); return String(format: "%02d:%02d", n / 60, n % 60) }
}
