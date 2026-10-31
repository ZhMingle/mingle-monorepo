import AppKit

enum Theme {
    static let background = NSColor(srgbRed: 17/255, green: 24/255, blue: 31/255, alpha: 1)
    static let card = NSColor(srgbRed: 26/255, green: 36/255, blue: 45/255, alpha: 1)
    static let mint = NSColor(srgbRed: 140/255, green: 236/255, blue: 195/255, alpha: 1)
    static let white = NSColor(srgbRed: 239/255, green: 245/255, blue: 244/255, alpha: 1)
    static let muted = NSColor(srgbRed: 154/255, green: 174/255, blue: 181/255, alpha: 1)
    static let control = NSColor(srgbRed: 39/255, green: 54/255, blue: 64/255, alpha: 1)
    static func text(_ field: NSTextField, size: CGFloat, color: NSColor = white, weight: NSFont.Weight = .regular) {
        field.font = .systemFont(ofSize: size, weight: weight); field.textColor = color
    }
    static func button(_ button: NSButton, primary: Bool = false) {
        button.bezelStyle = .regularSquare; button.isBordered = false; button.wantsLayer = true
        button.layer?.backgroundColor = (primary ? mint : control).cgColor; button.layer?.cornerRadius = 10
        button.font = .systemFont(ofSize: 13, weight: .medium); button.contentTintColor = primary ? background : white
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
