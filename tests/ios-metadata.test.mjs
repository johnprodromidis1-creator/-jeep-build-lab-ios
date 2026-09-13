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

test("Capacitor config points at the offline bundle without a remote app shell", async () => {
  const config = await source("capacitor.config.ts");

  assert.match(config, /appId:\s*'com\.johnprodromidis\.jeepbuildlab'/);
  assert.match(config, /appName:\s*'Jeep Build Lab'/);
  assert.match(config, /webDir:\s*'mobile-dist'/);
  assert.match(config, /ios:\s*\{[^}]*contentInset:\s*'automatic'/s);
  assert.doesNotMatch(config, /\bserver\s*:/);
});

test("mobile shell keeps the packaged app offline by default", async () => {
  const html = await source("mobile/index.html");

  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /<title>Jeep Build Lab<\/title>/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /<script type="module" src="\/main\.tsx"><\/script>/);
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

test("Swift package wiring stays pinned to Capacitor and local native plugins", async () => {
  const spm = await source("ios/App/CapApp-SPM/Package.swift");

  assert.match(spm, /platforms:\s*\[\.iOS\(\.v17\)\]/);
  assert.match(spm, /capacitor-swift-pm\.git", exact: "8\.5\.1"/);
  assert.match(spm, /package\(name: "CapacitorBrowser", path: "\.\.\/\.\.\/\.\.\/node_modules\/@capacitor\/browser"\)/);
  assert.match(spm, /package\(name: "CapacitorFilesystem", path: "\.\.\/\.\.\/\.\.\/node_modules\/@capacitor\/filesystem"\)/);
  assert.match(spm, /package\(name: "CapacitorShare", path: "\.\.\/\.\.\/\.\.\/node_modules\/@capacitor\/share"\)/);
  assert.doesNotMatch(spm, /\.pnpm|App\/App\/public/);
});
