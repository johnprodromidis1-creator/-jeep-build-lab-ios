#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const EXPECTED_BUNDLE_ID = "com.johnprodromidis.jeepbuildlab";
export const EXPECTED_VERSION = "0.2.0";
export const LIVE_SITE_URL = "https://jeep-build-lab.johnprodromidis1.chatgpt.site";

const nativeSafeTests =
  "node --test tests/model.test.mjs tests/device-storage.test.mjs tests/ios-metadata.test.mjs tests/platform.test.mjs";

const scriptRoot = fileURLToPath(new URL("..", import.meta.url));

async function source(root, file) {
  return readFile(path.join(root, file), "utf8");
}

async function exists(root, file) {
  try {
    await access(path.join(root, file));
    return true;
  } catch {
    return false;
  }
}

function check(checks, ok, label, detail = "") {
  checks.push({ ok: Boolean(ok), label, detail });
}

function has(text, pattern) {
  return pattern.test(text);
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

export async function runPreflight(projectRoot = scriptRoot) {
  const checks = [];
  const [
    packageSource,
    codemagic,
    iosVerify,
    project,
    info,
    capacitor,
    mobileHtml,
    privacyManifest,
    readiness,
    codemagicDoc,
    testflightDoc,
  ] = await Promise.all([
    source(projectRoot, "package.json"),
    source(projectRoot, "codemagic.yaml"),
    source(projectRoot, "scripts/ios-verify.sh"),
    source(projectRoot, "ios/App/App.xcodeproj/project.pbxproj"),
    source(projectRoot, "ios/App/App/Info.plist"),
    source(projectRoot, "capacitor.config.ts"),
    source(projectRoot, "mobile/index.html"),
    source(projectRoot, "ios/App/App/PrivacyInfo.xcprivacy"),
    source(projectRoot, "docs/app-store/READINESS.md"),
    source(projectRoot, "docs/app-store/CODEMAGIC.md"),
    source(projectRoot, "docs/app-store/TESTFLIGHT.md"),
  ]);
  const packageJson = JSON.parse(packageSource);

  check(checks, packageJson.version === EXPECTED_VERSION, "package version matches iOS marketing version");
  check(checks, packageJson.scripts?.["release:preflight"] === "node scripts/app-store-preflight.mjs", "release preflight script is exposed");
  check(checks, packageJson.scripts?.["test:native"] === nativeSafeTests, "native-safe regression suite is stable");

  check(checks, has(codemagic, /jeep-ios-verify:/), "Codemagic keeps unsigned iOS verification workflow");
  check(checks, has(codemagic, /jeep-ios-testflight:/), "Codemagic keeps manual TestFlight workflow");
  check(checks, has(codemagic, /xcode: 26\.6/), "Codemagic uses Xcode 26.6");
  check(checks, has(codemagic, /node: 24\.19\.0/), "Codemagic uses Node 24.19.0");
  check(checks, has(codemagic, /bundle_identifier: com\.johnprodromidis\.jeepbuildlab/), "Codemagic signing selector targets this Bundle ID");
  check(checks, has(codemagic, /BUNDLE_ID: com\.johnprodromidis\.jeepbuildlab/), "Codemagic preparation environment uses this Bundle ID");
  check(checks, has(codemagic, /app_store_connect: spice_czar_apple/), "Codemagic App Store integration name is present");
  check(checks, has(codemagic, /submit_to_testflight: false/), "Codemagic does not request external beta review");
  check(checks, has(codemagic, /submit_to_app_store: false/), "Codemagic does not submit App Store review");
  check(checks, !has(codemagic, /\btriggering:/), "Codemagic workflows remain manual");
  check(checks, has(codemagic, /name: Run release preflight\s+script: npm run release:preflight/), "TestFlight workflow runs release preflight");
  check(checks, has(iosVerify, /npm ci\s+npm run release:preflight\s+npx tsc --noEmit/), "unsigned iOS verify script runs release preflight after install");

  check(checks, countMatches(project, new RegExp(`PRODUCT_BUNDLE_IDENTIFIER = ${EXPECTED_BUNDLE_ID.replace(/\./g, "\\.")};`, "g")) === 2, "Debug and Release Bundle IDs match");
  check(checks, has(project, /MARKETING_VERSION = 0\.2\.0;/), "Xcode marketing version is 0.2.0");
  check(checks, has(project, /CURRENT_PROJECT_VERSION = 1;/), "source build number starts at 1 before Codemagic assignment");
  check(checks, has(project, /TARGETED_DEVICE_FAMILY = "1,2";/), "iPhone and iPad screenshots are still required");

  check(checks, has(info, /<key>CFBundleDisplayName<\/key>\s*<string>Jeep Build Lab<\/string>/), "Info.plist display name is Jeep Build Lab");
  check(checks, has(info, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/), "export compliance plist flag remains false");
  check(checks, !has(info, /NSCameraUsageDescription|NSMicrophoneUsageDescription|NSLocationWhenInUseUsageDescription|NSPhotoLibraryUsageDescription/), "Info.plist avoids unused sensitive permissions");

  check(checks, has(capacitor, /appId:\s*'com\.johnprodromidis\.jeepbuildlab'/), "Capacitor app id matches the registered identifier");
  check(checks, has(capacitor, /webDir:\s*'mobile-dist'/), "Capacitor points to the offline mobile bundle");
  check(checks, !has(capacitor, /\bserver\s*:/), "Capacitor does not load a remote web shell");
  check(checks, has(mobileHtml, /default-src 'self'/), "mobile CSP keeps assets local");
  check(checks, has(mobileHtml, /connect-src 'none'/), "mobile CSP denies app network calls");
  check(checks, has(mobileHtml, /form-action 'none'/), "mobile CSP denies form posts");

  check(checks, has(privacyManifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/), "privacy manifest declares no tracking");
  check(checks, has(privacyManifest, /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/), "privacy manifest declares no collected data types");
  check(checks, has(privacyManifest, /<string>NSPrivacyAccessedAPICategoryFileTimestamp<\/string>/), "privacy manifest keeps Filesystem timestamp reason");
  check(checks, has(privacyManifest, /<string>C617\.1<\/string>/), "privacy manifest keeps the app-owned file timestamp reason");

  check(checks, await exists(projectRoot, "app/privacy/page.tsx"), "privacy route exists");
  check(checks, await exists(projectRoot, "app/support/page.tsx"), "support route exists");
  check(checks, readiness.includes(LIVE_SITE_URL), "readiness handoff includes the live public site");
  check(checks, has(readiness, /no signed IPA or TestFlight upload has been verified/i), "readiness keeps signed-build status honest");
  check(checks, has(codemagicDoc, /matching provisioning profile/i), "Codemagic guide calls out the app-specific profile");
  check(checks, has(codemagicDoc, /No automatic push triggers or paid plan changes are configured/i), "Codemagic guide keeps cost/trigger guardrail");
  check(checks, has(testflightDoc, /This app's Apple record and provisioning profile remain unverified/i), "TestFlight guide keeps account-owner signing gate");

  return {
    ok: checks.every((item) => item.ok),
    expected: {
      bundleId: EXPECTED_BUNDLE_ID,
      version: EXPECTED_VERSION,
      liveSiteUrl: LIVE_SITE_URL,
    },
    checks,
  };
}

function formatReport(report) {
  const lines = [
    `Jeep Build Lab App Store preflight (${report.expected.bundleId}, ${report.expected.version})`,
  ];
  for (const item of report.checks) {
    lines.push(`${item.ok ? "OK  " : "FAIL"} ${item.label}${item.detail ? ` - ${item.detail}` : ""}`);
  }
  lines.push(report.ok ? "Preflight passed." : "Preflight failed.");
  return lines.join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runPreflight();
  console.log(formatReport(report));
  if (!report.ok) {
    process.exitCode = 1;
  }
}
