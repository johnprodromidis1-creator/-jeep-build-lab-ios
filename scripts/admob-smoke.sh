#!/usr/bin/env bash
set -euo pipefail
mkdir -p build/admob
if [[ -f project.yml && -d LineLab ]]; then
  command -v xcodegen >/dev/null || brew install xcodegen
  xcodegen generate
  project=LineLab.xcodeproj
  scheme=LineLab
  app_name=LineLab
  launch_args=(-linelab.completedOnboarding YES -linelab.confirmedAdult YES)
else
  project=ios/App/App.xcodeproj
  scheme=App
  app_name=App
  launch_args=()
fi
xcrun simctl list devices available -j > build/admob/devices.json
device=$(python3 - <<'PY'
import json
d=json.load(open('build/admob/devices.json'))['devices']
c=[v for runtime,devices in d.items() if 'iOS' in runtime for v in devices if v.get('isAvailable') and v['name'].startswith('iPhone')]
if not c: raise SystemExit('No available iPhone simulator')
print(next((v for v in c if 'Pro Max' in v['name']),c[0])['udid'])
PY
)
xcrun simctl boot "$device" 2>/dev/null || true
xcrun simctl bootstatus "$device" -b
xcodebuild -project "$project" -scheme "$scheme" -configuration Debug \
  -destination "id=$device" -derivedDataPath build/admob/DerivedData \
  CODE_SIGNING_ALLOWED=NO build > build/admob/compile.log 2>&1 || {
  tail -100 build/admob/compile.log
  exit 1
}
app="build/admob/DerivedData/Build/Products/Debug-iphonesimulator/$app_name.app"
bundle=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app/Info.plist")
test "$(/usr/libexec/PlistBuddy -c 'Print :GADApplicationIdentifier' "$app/Info.plist")" = 'ca-app-pub-3940256099942544~1458002511'
xcrun simctl install "$device" "$app"
SIMCTL_CHILD_OS_ACTIVITY_DT_MODE=YES xcrun simctl launch --terminate-running-process --console "$device" "$bundle" "${launch_args[@]}" > build/admob/device.log 2>&1 &
launch_pid=$!
trap 'kill "$launch_pid" 2>/dev/null || true' EXIT
loaded=false
for i in $(seq 1 90); do
  if grep -q ADMOB_TEST_BANNER_LOADED build/admob/device.log; then loaded=true; break; fi
  sleep 1
done
xcrun simctl io "$device" screenshot build/admob/test-banner.png
git rev-parse HEAD > build/admob/source-commit.txt
printf '%s\n' "$bundle" > build/admob/bundle-id.txt
if [[ "$loaded" != true ]]; then
  tail -100 build/admob/device.log
  echo 'The real Google test banner did not report a successful load.' >&2
  exit 1
fi
echo 'Google test banner loaded in the compiled app. Review the screenshot for layout.'
