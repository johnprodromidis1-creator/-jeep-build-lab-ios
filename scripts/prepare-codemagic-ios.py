#!/usr/bin/env python3
"""Validate the bundled app and version a disposable Codemagic checkout."""
import json
import os
from pathlib import Path
import re


def prepare(root: Path, environment: dict[str, str]) -> int:
    expected_bundle = "com.johnprodromidis.jeepbuildlab"
    if environment.get("BUNDLE_ID") != expected_bundle:
        raise ValueError("BUNDLE_ID must match Jeep Build Lab's registered identifier.")
    sequence = environment.get("PROJECT_BUILD_NUMBER", "")
    offset = environment.get("BUILD_NUMBER_OFFSET", "0")
    if not re.fullmatch(r"[0-9]+", sequence) or not re.fullmatch(r"[0-9]+", offset):
        raise ValueError("Run in Codemagic with PROJECT_BUILD_NUMBER and a nonnegative BUILD_NUMBER_OFFSET.")
    number = int(sequence) + int(offset) + 1
    if number > 9999:
        raise ValueError("Build number exceeds 9999; configure a dotted Apple build-number scheme.")

    native_root = root / "ios/App/App"
    config = json.loads((native_root / "capacitor.config.json").read_text())
    if config.get("appId") != expected_bundle or config.get("server", {}).get("url"):
        raise ValueError("The iOS app must use the expected bundle ID and locally bundled content.")
    index = (native_root / "public/index.html").read_text()
    if "connect-src 'none'" not in index:
        raise ValueError("The offline app's expected network restriction is missing.")
    asset_paths = re.findall(r'(?:src|href)="([^"?#]+)', index)
    scripts = [path for path in asset_paths if path.endswith(".js")]
    if not scripts or any(not (native_root / "public" / path.lstrip("/")).is_file() for path in scripts):
        raise ValueError("The compiled mobile entry point is missing; run npm run ios:sync first.")

    project = root / "ios/App/App.xcodeproj/project.pbxproj"
    source = project.read_text()
    bundles = re.findall(r"PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);", source)
    if len(bundles) != 2 or any(bundle != expected_bundle for bundle in bundles):
        raise ValueError("Both Xcode configurations must use the expected app identifier.")
    updated, count = re.subn(r"CURRENT_PROJECT_VERSION = [0-9]+;", f"CURRENT_PROJECT_VERSION = {number};", source)
    if count != 2:
        raise ValueError("Expected Debug and Release build-number settings; no changes were written.")
    project.write_text(updated)
    return number


if __name__ == "__main__":
    try:
        build = prepare(Path(__file__).resolve().parents[1], dict(os.environ))
    except (ValueError, OSError, KeyError) as error:
        raise SystemExit(f"iOS preparation stopped: {error}") from error
    print(f"Jeep Build Lab: bundled content verified; iOS build number {build}.")
