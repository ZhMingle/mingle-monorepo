import AppKit

enum Theme {
    static let background = NSColor(srgbRed: 17/255, green: 24/255, blue: 31/255, alpha: 1)
    static let card = NSColor(srgbRed: 26/255, green: 36/255, blue: 45/255, alpha: 1)
    static let mint = NSColor(srgbRed: 140/255, green: 236/255, blue: 195/255, alpha: 1)
    static let white = NSColor(srgbRed: 239/255, green: 245/255, blue: 244/255, alpha: 1)
    static let muted = NSColor(srgbRed: 154/255, green: 174/255, blue: 181/255, alpha: 1)
    static let control = NSColor(srgbRed: 39/255, green: 54/255, blue: 64/255, alpha: 1)
    static func text(_ field: NSTextField, size: CGFloat, color: NSColor = white, weight: NSFont.Weight = .regular) {
        field.isEditable = false; field.isSelectable = false
        field.font = .systemFont(ofSize: size, weight: weight); field.textColor = color
    }
    static func button(_ button: NSButton, primary: Bool = false) {
        button.bezelStyle = .regularSquare; button.isBordered = false; button.wantsLayer = true
        button.layer?.backgroundColor = (primary ? mint : control).cgColor; button.layer?.cornerRadius = 10
        button.font = .systemFont(ofSize: 13, weight: .medium); button.contentTintColor = primary ? background : white
    }
}

// Three-finger dragging is delivered by macOS as ordinary mouse dragging.
// Track before controls consume the gesture so buttons remain drag handles too.
@MainActor private func handleWindowDrag(_ event: NSEvent, in window: NSWindow) -> Bool {
    guard event.type == .leftMouseDown,
          let content = window.contentView,
          content.bounds.contains(content.convert(event.locationInWindow, from: nil)) else { return false }
    let start = NSEvent.mouseLocation
    let origin = window.frame.origin
    var dragging = false
    while let next = window.nextEvent(matching: [.leftMouseDragged, .leftMouseUp], until: .distantFuture, inMode: .eventTracking, dequeue: true) {
        let point = NSEvent.mouseLocation
        let dx = point.x - start.x, dy = point.y - start.y
        if next.type == .leftMouseDragged {
            if hypot(dx, dy) >= 3 { dragging = true }
            if dragging { window.setFrameOrigin(NSPoint(x: origin.x + dx, y: origin.y + dy)) }
        } else {
            if !dragging {
                // Let the original control handle a normal click and its mouse-up.
                NSApp.postEvent(next, atStart: true)
                return false
            }
            return true
        }
    }
    return true
}

final class DraggableWindow: NSWindow {
    override func sendEvent(_ event: NSEvent) {
        if !handleWindowDrag(event, in: self) { super.sendEvent(event) }
    }
}

final class DraggablePanel: NSPanel {
    override func sendEvent(_ event: NSEvent) {
        if !handleWindowDrag(event, in: self) { super.sendEvent(event) }
    }
}
final class Surface: NSView {
    override var isFlipped: Bool { true }
    init(_ frame: NSRect, color: NSColor, radius: CGFloat = 0) {
        super.init(frame: frame); wantsLayer = true; layer?.backgroundColor = color.cgColor; layer?.cornerRadius = radius
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
}
final class TimerDial: NSView {
    var progress: Double = 0 { didSet { needsDisplay = true } }
    override func draw(_ dirtyRect: NSRect) {
        let rect = bounds.insetBy(dx: 9, dy: 9)
        let track = NSBezierPath(ovalIn: rect); track.lineWidth = 6; Theme.control.setStroke(); track.stroke()
        guard progress > 0 else { return }
        let arc = NSBezierPath(); arc.lineWidth = 6; arc.lineCapStyle = .round
        arc.appendArc(withCenter: NSPoint(x: bounds.midX, y: bounds.midY), radius: rect.width / 2, startAngle: 90, endAngle: 90 - CGFloat(min(1, max(0, progress))) * 360, clockwise: true)
        Theme.mint.setStroke(); arc.stroke()
    }
}
