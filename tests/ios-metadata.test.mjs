import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function source(file) {
  return readFile(path.join(root, file), "utf8");
}

test("iOS project keeps App Store identity, version and device-family settings aligned", async () => {
  const project = await source("ios/App/App.xcodeproj/project.pbxproj");
  const info = await source("ios/App/App/Info.plist");

  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.johnprodromidis\.jeepbuildlab;/);
  assert.match(project, /MARKETING_VERSION = 0\.2\.0;/);
  assert.match(project, /CURRENT_PROJECT_VERSION = 1;/);
  assert.match(project, /TARGETED_DEVICE_FAMILY = "1,2";/);

  assert.match(info, /<key>CFBundleDisplayName<\/key>\s*<string>Jeep Build Lab<\/string>/);
  assert.match(info, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.doesNotMatch(info, /NSCameraUsageDescription|NSMicrophoneUsageDescription|NSLocationWhenInUseUsageDescription|NSPhotoLibraryUsageDescription/);
});

test("privacy manifest is packaged and declares the current no-tracking local-file usage", async () => {
  const project = await source("ios/App/App.xcodeproj/project.pbxproj");
  const privacy = await source("ios/App/App/PrivacyInfo.xcprivacy");

  assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(privacy, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(privacy, /<key>NSPrivacyTrackingDomains<\/key>\s*<array\/>/);
  assert.match(privacy, /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/);
  assert.match(privacy, /<string>NSPrivacyAccessedAPICategoryFileTimestamp<\/string>/);
  assert.match(privacy, /<string>C617\.1<\/string>/);
});
