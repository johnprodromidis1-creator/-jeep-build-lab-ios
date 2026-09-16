import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EXPECTED_BUNDLE_ID, EXPECTED_LIVE_SITES_VERSION, EXPECTED_VERSION, runPreflight } from "../scripts/app-store-preflight.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("App Store preflight keeps release guardrails aligned", async () => {
  const report = await runPreflight(root);
  const failures = report.checks
    .filter((item) => !item.ok)
    .map((item) => item.label)
    .join("\n");

  assert.equal(report.expected.bundleId, EXPECTED_BUNDLE_ID);
  assert.equal(report.expected.version, EXPECTED_VERSION);
  assert.equal(EXPECTED_LIVE_SITES_VERSION, 113);
  const labels = new Set(report.checks.map((item) => item.label));
  assert.ok(labels.has("screenshot plan covers iPhone and iPad targets"));
  assert.ok(labels.has("screenshot plan requires native signed/TestFlight captures"));
  assert.ok(labels.has("screenshot plan rejects browser or generated final screenshots"));
  assert.ok(labels.has("screenshot plan protects private capture data"));
  assert.ok(labels.has("readiness records the current regression count"));
  assert.ok(labels.has("readiness records the catalog depth proof strip"));
  assert.ok(labels.has("readiness records the latest Sites version"));
  assert.ok(labels.has("readiness records the signing-profile gate"));
  assert.ok(labels.has("readiness records blank blocked-target guidance"));
  assert.ok(labels.has("readiness records paused partner-target guidance"));
  assert.ok(labels.has("readiness records paused application export guidance"));
  assert.ok(labels.has("readiness records paused application notes panel"));
  assert.ok(labels.has("readiness records status-filtered application order"));
  assert.ok(labels.has("README handoff includes the live public site"));
  assert.ok(labels.has("README records the latest Sites version"));
  assert.ok(labels.has("README records the signing-profile gate"));
  assert.ok(labels.has("README records blank blocked-target guidance"));
  assert.ok(labels.has("README records paused partner-target guidance"));
  assert.ok(labels.has("README records paused application export guidance"));
  assert.ok(labels.has("README records paused application notes panel"));
  assert.ok(labels.has("README records status-filtered application order"));
  assert.ok(labels.has("Codemagic prep enforces the registered Bundle ID"));
  assert.ok(labels.has("Codemagic prep derives build numbers from Codemagic"));
  assert.ok(labels.has("Codemagic prep rejects wrong IDs and remote shells"));
  assert.ok(labels.has("Codemagic prep verifies the offline mobile bundle"));
  assert.ok(labels.has("Codemagic prep updates both Xcode build configurations"));
  assert.ok(labels.has("TestFlight workflow checks signing profile before archive"));
  assert.ok(labels.has("Codemagic signing check names the missing profile gate"));
  assert.ok(labels.has("Codemagic signing check rejects non-App Store profiles"));
  assert.ok(labels.has("Codemagic guide records the current regression count"));
  assert.ok(labels.has("Codemagic guide records the catalog depth proof strip"));
  assert.ok(labels.has("Codemagic guide records the latest Sites version"));
  assert.ok(labels.has("Codemagic guide records blank blocked-target guidance"));
  assert.ok(labels.has("Codemagic guide records paused partner-target guidance"));
  assert.ok(labels.has("Codemagic guide records paused application export guidance"));
  assert.ok(labels.has("Codemagic guide records paused application notes panel"));
  assert.ok(labels.has("Codemagic guide records status-filtered application order"));
  assert.ok(report.checks.length >= 43);
  assert.equal(report.ok, true, failures);
});
