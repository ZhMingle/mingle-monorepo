import AppKit

// A rising sun above a quiet horizon, using Rise's mint and slate palette.
let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
let tile = NSBezierPath(roundedRect: NSRect(x: 64, y: 64, width: 896, height: 896), xRadius: 202, yRadius: 202)
NSGradient(starting: NSColor(srgbRed: 0.16, green: 0.23, blue: 0.27, alpha: 1),
    ending: NSColor(srgbRed: 0.07, green: 0.11, blue: 0.15, alpha: 1))!.draw(in: tile, angle: -90)
let mint = NSColor(srgbRed: 140/255, green: 236/255, blue: 195/255, alpha: 1)
mint.setStroke()
let sun = NSBezierPath()
sun.lineWidth = 58
sun.lineCapStyle = .round
sun.appendArc(withCenter: NSPoint(x: 512, y: 414), radius: 190, startAngle: 0, endAngle: 180)
sun.stroke()
let horizon = NSBezierPath()
horizon.lineWidth = 48
horizon.lineCapStyle = .round
horizon.move(to: NSPoint(x: 278, y: 310))
horizon.line(to: NSPoint(x: 746, y: 310))
horizon.stroke()
for (start, end) in [
    (NSPoint(x: 512, y: 706), NSPoint(x: 512, y: 756)),
    (NSPoint(x: 300, y: 626), NSPoint(x: 265, y: 661)),
    (NSPoint(x: 724, y: 626), NSPoint(x: 759, y: 661))
] {
    let ray = NSBezierPath()
    ray.lineWidth = 38
    ray.lineCapStyle = .round
    ray.move(to: start); ray.line(to: end); ray.stroke()
}
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
