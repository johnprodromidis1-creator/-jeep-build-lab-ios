import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EXPECTED_BUNDLE_ID, EXPECTED_VERSION, runPreflight } from "../scripts/app-store-preflight.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("App Store preflight keeps release guardrails aligned", async () => {
  const report = await runPreflight(root);
  const failures = report.checks
    .filter((item) => !item.ok)
    .map((item) => item.label)
    .join("\n");

  assert.equal(report.expected.bundleId, EXPECTED_BUNDLE_ID);
  assert.equal(report.expected.version, EXPECTED_VERSION);
  const labels = new Set(report.checks.map((item) => item.label));
  assert.ok(labels.has("screenshot plan covers iPhone and iPad targets"));
  assert.ok(labels.has("screenshot plan requires native signed/TestFlight captures"));
  assert.ok(labels.has("screenshot plan rejects browser or generated final screenshots"));
  assert.ok(labels.has("screenshot plan protects private capture data"));
  assert.ok(report.checks.length >= 37);
  assert.equal(report.ok, true, failures);
});
