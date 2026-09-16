#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const EXPECTED_BUNDLE_ID = "com.johnprodromidis.jeepbuildlab";
export const EXPECTED_VERSION = "0.2.0";
export const LIVE_SITE_URL = "https://jeep-build-lab.johnprodromidis1.chatgpt.site";
export const EXPECTED_LIVE_SITES_VERSION = 120;

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
    codemagicPrepare,
    codemagicSigningCheck,
    project,
    info,
    capacitor,
    mobileHtml,
    privacyManifest,
    readme,
    readiness,
    codemagicDoc,
    marketPositioning,
    buildRecipesDoc,
    shopBriefDoc,
    builderDoc,
    globalCss,
    testflightDoc,
    screenshotsDoc,
  ] = await Promise.all([
    source(projectRoot, "package.json"),
    source(projectRoot, "codemagic.yaml"),
    source(projectRoot, "scripts/ios-verify.sh"),
    source(projectRoot, "scripts/prepare-codemagic-ios.py"),
    source(projectRoot, "scripts/check-codemagic-signing.sh"),
    source(projectRoot, "ios/App/App.xcodeproj/project.pbxproj"),
    source(projectRoot, "ios/App/App/Info.plist"),
    source(projectRoot, "capacitor.config.ts"),
    source(projectRoot, "mobile/index.html"),
    source(projectRoot, "ios/App/App/PrivacyInfo.xcprivacy"),
    source(projectRoot, "README.md"),
    source(projectRoot, "docs/app-store/READINESS.md"),
    source(projectRoot, "docs/app-store/CODEMAGIC.md"),
    source(projectRoot, "docs/market-positioning-2026-09-16.md"),
    source(projectRoot, "lib/build-recipes.ts"),
    source(projectRoot, "lib/shop-brief.ts"),
    source(projectRoot, "app/builder.tsx"),
    source(projectRoot, "app/globals.css"),
    source(projectRoot, "docs/app-store/TESTFLIGHT.md"),
    source(projectRoot, "docs/app-store/SCREENSHOTS.md"),
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
  check(checks, has(codemagicPrepare, /environment\.get\("BUNDLE_ID"\) != expected_bundle/), "Codemagic prep enforces the registered Bundle ID");
  check(checks, has(codemagicPrepare, /PROJECT_BUILD_NUMBER/) && has(codemagicPrepare, /BUILD_NUMBER_OFFSET/), "Codemagic prep derives build numbers from Codemagic");
  check(checks, has(codemagicPrepare, /number = int\(sequence\) \+ int\(offset\) \+ 1/), "Codemagic prep increments each uploaded build number");
  check(checks, has(codemagicPrepare, /config\.get\("appId"\) != expected_bundle/) && has(codemagicPrepare, /config\.get\("server", \{\}\)\.get\("url"\)/), "Codemagic prep rejects wrong IDs and remote shells");
  check(checks, has(codemagicPrepare, /connect-src 'none'/) && has(codemagicPrepare, /compiled mobile entry point is missing/), "Codemagic prep verifies the offline mobile bundle");
  check(checks, has(codemagicPrepare, /len\(bundles\) != 2/) && has(codemagicPrepare, /if count != 2:/), "Codemagic prep updates both Xcode build configurations");
  check(checks, has(codemagic, /script: bash scripts\/check-codemagic-signing\.sh/), "TestFlight workflow checks signing profile before archive");
  check(checks, has(codemagicSigningCheck, /App Store provisioning profile/) && has(codemagicSigningCheck, /Codemagic currently has profiles for other apps only/), "Codemagic signing check names the missing profile gate");
  check(checks, has(codemagicSigningCheck, /Entitlements:get-task-allow/) && has(codemagicSigningCheck, /ProvisionedDevices/), "Codemagic signing check rejects non-App Store profiles");

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
  check(checks, readme.includes(LIVE_SITE_URL), "README handoff includes the live public site");
  check(checks, readme.includes(`Sites version ${EXPECTED_LIVE_SITES_VERSION}`), "README records the latest Sites version");
  check(checks, has(readme, /early Codemagic signing-profile gate/i), "README records the signing-profile gate");
  check(checks, has(readme, /blank blocked targets stay visible with default blocker guidance/i), "README records blank blocked-target guidance");
  check(checks, has(readme, /paused partner targets skip next-action guidance/i), "README records paused partner-target guidance");
  check(checks, has(readme, /paused application follow-up exports/i), "README records paused application export guidance");
  check(checks, has(readme, /visible paused application notes panel/i), "README records paused application notes panel");
  check(checks, has(readme, /status-filtered actionable application order/i), "README records status-filtered application order");
  check(checks, has(readme, /blocked and paused reset controls/i), "README records blocked and paused reset controls");
  check(checks, has(readme, /submitted and approved launch follow-up panel/i), "README records submitted and approved launch follow-up panel");
  check(checks, has(readme, /launch proof checklist/i), "README records paid-link launch proof checklist");
  check(checks, has(readme, /market-positioning memo/i), "README records market-positioning memo");
  check(checks, has(readme, /six source-backed owner-intent starter packs/i), "README records owner-intent starter packs");
  check(checks, has(readme, /installer quote checklist/i), "README records installer quote checklist");
  check(checks, readiness.includes(LIVE_SITE_URL), "readiness handoff includes the live public site");
  check(checks, readiness.includes(`Sites version ${EXPECTED_LIVE_SITES_VERSION}`), "readiness records the latest Sites version");
  check(checks, has(readiness, /no signed IPA or TestFlight upload has been verified/i), "readiness keeps signed-build status honest");
  check(checks, has(readiness, /early signing-profile gate/i), "readiness records the signing-profile gate");
  check(checks, has(readiness, /passes 78 tests/i), "readiness records the current regression count");
  check(checks, has(readiness, /in-picker 15\+ choice depth proof strip/i), "readiness records the catalog depth proof strip");
  check(checks, has(readiness, /blank blocked targets stay visible with default blocker guidance/i), "readiness records blank blocked-target guidance");
  check(checks, has(readiness, /paused partner targets skip next-action guidance/i), "readiness records paused partner-target guidance");
  check(checks, has(readiness, /paused application follow-up exports/i), "readiness records paused application export guidance");
  check(checks, has(readiness, /visible paused application notes panel/i), "readiness records paused application notes panel");
  check(checks, has(readiness, /status-filtered actionable application order/i), "readiness records status-filtered application order");
  check(checks, has(readiness, /blocked and paused reset controls/i), "readiness records blocked and paused reset controls");
  check(checks, has(readiness, /submitted and approved launch follow-up panel/i), "readiness records submitted and approved launch follow-up panel");
  check(checks, has(readiness, /launch proof checklist/i), "readiness records paid-link launch proof checklist");
  check(checks, has(readiness, /neutral build-advisor layer/i), "readiness records neutral build-advisor positioning");
  check(checks, has(readiness, /six source-backed owner-intent starter packs/i), "readiness records owner-intent starter packs");
  check(checks, has(readiness, /installer quote checklist/i), "readiness records installer quote checklist");
  check(checks, has(codemagicDoc, /matching provisioning profile/i), "Codemagic guide calls out the app-specific profile");
  check(checks, codemagicDoc.includes(`Sites version ${EXPECTED_LIVE_SITES_VERSION}`), "Codemagic guide records the latest Sites version");
  check(checks, has(codemagicDoc, /expanded 78-test regression suite/i), "Codemagic guide records the current regression count");
  check(checks, has(codemagicDoc, /in-picker 15\+ choice proof strip/i), "Codemagic guide records the catalog depth proof strip");
  check(checks, has(codemagicDoc, /blank blocked targets stay visible with default blocker guidance/i), "Codemagic guide records blank blocked-target guidance");
  check(checks, has(codemagicDoc, /paused partner targets skip next-action guidance/i), "Codemagic guide records paused partner-target guidance");
  check(checks, has(codemagicDoc, /paused application follow-up exports/i), "Codemagic guide records paused application export guidance");
  check(checks, has(codemagicDoc, /visible paused application notes panel/i), "Codemagic guide records paused application notes panel");
  check(checks, has(codemagicDoc, /status-filtered actionable application order/i), "Codemagic guide records status-filtered application order");
  check(checks, has(codemagicDoc, /blocked and paused reset controls/i), "Codemagic guide records blocked and paused reset controls");
  check(checks, has(codemagicDoc, /submitted and approved launch follow-up panel/i), "Codemagic guide records submitted and approved launch follow-up panel");
  check(checks, has(codemagicDoc, /launch proof checklist/i), "Codemagic guide records paid-link launch proof checklist");
  check(checks, has(codemagicDoc, /market-positioning memo/i), "Codemagic guide records market-positioning memo");
  check(checks, has(codemagicDoc, /six source-backed owner-intent starter packs/i), "Codemagic guide records owner-intent starter packs");
  check(checks, has(codemagicDoc, /installer quote checklist/i), "Codemagic guide records installer quote checklist");
  check(checks, has(codemagicDoc, /No automatic push triggers or paid plan changes are configured/i), "Codemagic guide keeps cost/trigger guardrail");
  check(checks, has(marketPositioning, /neutral build-advisor layer/i), "market-positioning memo names the neutral advisor wedge");
  check(checks, has(marketPositioning, /Jeep official Wrangler/i) && has(marketPositioning, /RealTruck/i) && has(marketPositioning, /Quadratec/i) && has(marketPositioning, /ExtremeTerrain/i), "market-positioning memo covers current competitor set");
  check(checks, has(marketPositioning, /Do not compete on/i) && has(marketPositioning, /Paid-link or commission claims/i), "market-positioning memo keeps commerce claims constrained");
  check(checks, has(marketPositioning, /six source-backed owner-intent starter packs/i), "market-positioning memo records template-pack implementation");
  check(checks, has(buildRecipesDoc, /Low-cost visual refresh/) && has(buildRecipesDoc, /Beach weekend 4xe/) && has(buildRecipesDoc, /Overland weekend recovery/), "starter recipes include new owner-intent packs");
  check(checks, has(shopBriefDoc, /export function installerQuoteChecklist/) && has(shopBriefDoc, /Installer quote checklist/), "shop brief exports installer quote checklist");
  check(checks, has(builderDoc, /aria-label="Installer quote checklist"/) && has(builderDoc, /installerQuoteItems=installerQuoteChecklist/), "builder surfaces installer quote checklist");
  check(checks, has(globalCss, /\.installer-quote-checklist/) && has(globalCss, /\.installer-quote-row\.needs-review/), "styles cover installer quote checklist states");
  check(checks, has(testflightDoc, /This app's Apple record and provisioning profile remain unverified/i), "TestFlight guide keeps account-owner signing gate");
  check(checks, has(screenshotsDoc, /one to 10 screenshots per device size/i), "screenshot plan keeps App Store count limits");
  check(checks, has(screenshotsDoc, /cannot include alpha\/transparency/i), "screenshot plan forbids alpha transparency");
  check(checks, has(screenshotsDoc, /iPhone 6\.9-inch/i) && has(screenshotsDoc, /iPad 13-inch/i), "screenshot plan covers iPhone and iPad targets");
  check(checks, has(screenshotsDoc, /Use raw screenshots from the actual signed or TestFlight app first/i), "screenshot plan requires native signed/TestFlight captures");
  check(checks, has(screenshotsDoc, /do not submit browser captures or generated mockups/i), "screenshot plan rejects browser or generated final screenshots");
  check(checks, countMatches(screenshotsDoc, /^\d+\. /gm) >= 5 && countMatches(screenshotsDoc, /^\d+\. /gm) <= 10, "screenshot plan has a bounded capture sequence");
  check(checks, has(screenshotsDoc, /Do not include real personal build notes, email inboxes, passwords, Apple IDs, notification banners or browser chrome/i), "screenshot plan protects private capture data");

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
