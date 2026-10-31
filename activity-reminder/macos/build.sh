#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
APP="$PWD/build/Rise.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" "$PWD/build/module-cache"
MACOSX_DEPLOYMENT_TARGET=13.0 xcrun swiftc -swift-version 5 -O -module-cache-path "$PWD/build/module-cache" -framework AppKit -framework CoreGraphics Clock.swift Usage.swift Theme.swift main.swift -o "$APP/Contents/MacOS/Rise"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>Rise</string>
<key>CFBundleIdentifier</key><string>com.mingle.activity-reminder</string>
<key>CFBundleName</key><string>Rise</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0.0</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --sign - "$APP"
printf 'Built %s\n' "$APP"
