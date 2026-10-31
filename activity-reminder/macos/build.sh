#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
APP="$PWD/build/Rise.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" "$PWD/build/module-cache"
MACOSX_DEPLOYMENT_TARGET=13.0 xcrun swiftc -swift-version 5 -O -module-cache-path "$PWD/build/module-cache" -framework AppKit -framework CoreGraphics Clock.swift Usage.swift Theme.swift main.swift -o "$APP/Contents/MacOS/Rise"
ICONSET="$PWD/build/Rise.iconset"
mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
    sips -z "$size" "$size" assets/Rise.png --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
    retina=$((size * 2))
    sips -z "$retina" "$retina" assets/Rise.png --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/Rise.icns"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>Rise</string>
<key>CFBundleIdentifier</key><string>com.mingle.activity-reminder</string>
<key>CFBundleName</key><string>Rise</string>
<key>CFBundleIconFile</key><string>Rise</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0.0</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --sign - "$APP"
printf 'Built %s\n' "$APP"
