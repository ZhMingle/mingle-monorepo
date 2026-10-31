#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! xcrun --find swiftc >/dev/null 2>&1; then
  echo 'Install Apple Command Line Tools (xcode-select --install), then run this again.'
  exit 1
fi
./macos/build.sh
open ./macos/build/Rise.app
