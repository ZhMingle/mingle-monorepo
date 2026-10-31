#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build/module-cache
xcrun swiftc -swift-version 5 -module-cache-path "$PWD/build/module-cache" Clock.swift Usage.swift Tests.swift -o build/RiseTests
./build/RiseTests "$@"
