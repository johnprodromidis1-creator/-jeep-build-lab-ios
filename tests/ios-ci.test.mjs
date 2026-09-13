import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const nativeSafeTests =
  "node --test tests/model.test.mjs tests/device-storage.test.mjs tests/ios-metadata.test.mjs tests/platform.test.mjs";
const nativeSafeScript = "npm run test:native";

async function source(file) {
  return readFile(path.join(root, file), "utf8");
}

function assertInOrder(sourceText, labels) {
  let cursor = -1;
  for (const label of labels) {
    const index = sourceText.indexOf(label, cursor + 1);
    assert.notEqual(index, -1, `Missing expected CI command: ${label}`);
    assert.ok(index > cursor, `Expected ${label} after the previous CI command`);
    cursor = index;
  }
}

test("Codemagic iOS compile check runs offline sync, app regressions and unsigned native build", async () => {
  const config = await source("codemagic.yaml");
  const verifyScript = await source("scripts/ios-verify.sh");
  const packageJson = JSON.parse(await source("package.json"));

  assert.equal(packageJson.scripts["test:native"], nativeSafeTests);

  assert.match(config, /jeep-ios-verify:/);
  assert.match(config, /script: bash scripts\/ios-verify\.sh/);
  assert.match(config, /xcode: 26\.6/);
  assert.match(config, /ios\/DerivedData\/Build\/Products\/Debug-iphonesimulator\/\*\.app/);
  assert.match(config, /build\/ios\/verify\/\*\.xcresult/);

  assertInOrder(verifyScript, [
    "npm ci",
    "npx tsc --noEmit",
    "npm run ios:sync",
    "npx eslint .",
    nativeSafeScript,
    "xcodebuild -project ios/App/App.xcodeproj",
    "CODE_SIGNING_ALLOWED=NO build",
  ]);
});

test("Codemagic TestFlight workflow validates app code before signing and upload", async () => {
  const config = await source("codemagic.yaml");

  assert.match(config, /jeep-ios-testflight:/);
  assert.match(config, /bundle_identifier: com\.johnprodromidis\.jeepbuildlab/);
  assert.match(config, /BUNDLE_ID: com\.johnprodromidis\.jeepbuildlab/);
  assert.match(config, /app_store_connect: spice_czar_apple/);
  assert.match(config, /submit_to_testflight: false/);
  assert.match(config, /submit_to_app_store: false/);

  assertInOrder(config, [
    "script: npm ci",
    "script: npx tsc --noEmit",
    "script: npm run ios:sync",
    "npx eslint .",
    nativeSafeScript,
    "script: python3 scripts/prepare-codemagic-ios.py",
    "script: xcode-project use-profiles",
    "xcode-project build-ipa",
  ]);
});
