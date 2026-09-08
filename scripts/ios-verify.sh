#!/usr/bin/env bash
set -euo pipefail
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS compilation requires a Mac with Xcode 26 or later." >&2
  exit 1
fi
command -v xcodebuild >/dev/null
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
xcodebuild -version
npm ci
npm run ios:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
