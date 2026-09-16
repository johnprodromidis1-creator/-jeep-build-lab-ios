#!/usr/bin/env bash
set -euo pipefail

expected_bundle="${BUNDLE_ID:-com.johnprodromidis.jeepbuildlab}"
profile_dir="${HOME}/Library/MobileDevice/Provisioning Profiles"

if [[ "${expected_bundle}" != "com.johnprodromidis.jeepbuildlab" ]]; then
  echo "Signing check stopped: BUNDLE_ID must be com.johnprodromidis.jeepbuildlab." >&2
  exit 1
fi

if [[ ! -d "${profile_dir}" ]]; then
  cat >&2 <<EOF
Signing check stopped: Codemagic has not installed any provisioning profiles.
Add or fetch an App Store provisioning profile for ${expected_bundle}, signed by the Apple Distribution certificate used by the spice_czar_apple integration.
EOF
  exit 1
fi

profiles=("${profile_dir}"/*.mobileprovision)
if [[ ! -e "${profiles[0]}" ]]; then
  cat >&2 <<EOF
Signing check stopped: no .mobileprovision files were found in Codemagic's profile directory.
Add or fetch an App Store provisioning profile for ${expected_bundle} before starting the TestFlight workflow.
EOF
  exit 1
fi

matched_wrong_type=0
for profile in "${profiles[@]}"; do
  decoded="$(mktemp)"
  if ! security cms -D -i "${profile}" > "${decoded}" 2>/dev/null; then
    rm -f "${decoded}"
    continue
  fi

  app_identifier="$(/usr/libexec/PlistBuddy -c "Print :Entitlements:application-identifier" "${decoded}" 2>/dev/null || true)"
  get_task_allow="$(/usr/libexec/PlistBuddy -c "Print :Entitlements:get-task-allow" "${decoded}" 2>/dev/null || true)"
  has_devices="$(/usr/libexec/PlistBuddy -c "Print :ProvisionedDevices" "${decoded}" >/dev/null 2>&1 && echo yes || echo no)"
  provisions_all_devices="$(/usr/libexec/PlistBuddy -c "Print :ProvisionsAllDevices" "${decoded}" 2>/dev/null || true)"
  profile_name="$(/usr/libexec/PlistBuddy -c "Print :Name" "${decoded}" 2>/dev/null || echo "Unnamed profile")"

  if [[ "${app_identifier}" == *".${expected_bundle}" ]]; then
    if [[ "${get_task_allow}" == "false" && "${has_devices}" == "no" && "${provisions_all_devices}" != "true" ]]; then
      echo "Signing check passed: found App Store profile '${profile_name}' for ${expected_bundle}."
      rm -f "${decoded}"
      exit 0
    fi
    matched_wrong_type=1
  fi

  rm -f "${decoded}"
done

if [[ "${matched_wrong_type}" == "1" ]]; then
  cat >&2 <<EOF
Signing check stopped: a profile for ${expected_bundle} was found, but it is not an App Store distribution profile.
Create or fetch an App Store provisioning profile for this exact Bundle ID before retrying TestFlight.
EOF
else
  cat >&2 <<EOF
Signing check stopped: no provisioning profile matched ${expected_bundle}.
Codemagic currently has profiles for other apps only. Add/fetch this app's App Store profile, then rerun the Jeep Build Lab -- TestFlight workflow.
EOF
fi
exit 1
