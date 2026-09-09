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
npx tsc --noEmit
npm run ios:sync
mkdir -p build/ios/verify
# Unique result bundles also support repeated local runs in the same checkout.
result_path="build/ios/verify/compile-$(date +%Y%m%d-%H%M%S)-$$.xcresult"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/DerivedData \
  -resultBundlePath "$result_path" CODE_SIGNING_ALLOWED=NO build \
  2>&1 | tee build/ios/verify/xcodebuild.log
