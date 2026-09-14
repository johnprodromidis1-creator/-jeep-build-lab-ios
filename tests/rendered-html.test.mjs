import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { registerHooks } from "node:module";
// Node render tests do not execute D1 routes. The separate model/API test supplies SQLite.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") return { url: "data:text/javascript,export const env = {};", shortCircuit: true };
  return nextResolve(specifier, context);
}});

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  const html = await response.text();
  return { response, html };
}

test("serves the builder with production metadata and the initial catalog", async () => {
  const { response, html } = await render("/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, /<title>Jeep Build Lab/);
  assert.match(html, /Choose your upgrades/);
  assert.match(html, /Load a 2024 Sahara 4xe sample/);
  assert.match(html, /Save to my garage/);
  assert.match(html, /Filter by brand/);
  assert.match(html, /Filter by price/);
  assert.match(html, /assets\/jeep-body\.png/);
  assert.match(html, /701 Trail Series/);
});

test("serves App Store support and privacy pages from the production worker", async () => {
  const privacy = await render("/privacy");
  const support = await render("/support");

  assert.equal(privacy.response.status, 200);
  assert.equal(support.response.status, 200);
  assert.doesNotMatch(privacy.html, developmentPreviewMeta);
  assert.doesNotMatch(support.html, developmentPreviewMeta);
  assert.match(privacy.html, /Privacy policy/);
  assert.match(privacy.html, /does not require an account/);
  assert.match(privacy.html, /does not request camera, contacts, microphone or photo-library access/);
  assert.match(support.html, /Support/);
  assert.match(support.html, /For help, email/);
  assert.match(support.html, /Offline use/);
});

test("mobile toast notifications stay above the sticky build sheet bar", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /<Toaster\b[^>]*position="bottom-center"[^>]*mobileOffset=\{\{/s);
  assert.match(source, /bottom:"calc\(92px \+ env\(safe-area-inset-bottom\)\)"/);
  assert.match(css, /\.mobile-total\{display:flex;position:fixed;bottom:0;/);
});

test("app-owned plain buttons declare non-submit behavior", async () => {
  const sources = [
    ["app/builder.tsx", await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8")],
    ["app/components/part-family.tsx", await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8")],
  ];
  const missingTypes = sources.flatMap(([file, source]) =>
    [...source.matchAll(/<button\b[^>]*>/g)]
      .map(match => match[0])
      .filter(tag => !/\btype=/.test(tag))
      .map(tag => `${file}: ${tag}`),
  );

  assert.deepEqual(missingTypes, []);
});

test("garage management includes search and fitment filters", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");

  assert.match(source, /Search saved builds/);
  assert.match(source, /Filter garage by powertrain/);
  assert.match(source, /Filter garage by fitment status/);
  assert.match(source, /Clear garage filters/);
});

test("builder surfaces the shop brief export", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");

  assert.match(source, /buildShopBrief/);
  assert.match(source, /exportSavedShopBrief/);
  assert.match(source, /Download shop brief/);
  assert.match(source, /Share shop brief/);
  assert.match(source, /Export shop brief for/);
});

test("comparison dialog can open the selected saved build", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const dialog = await readFile(new URL("../app/components/build-comparison.tsx", import.meta.url), "utf8");

  assert.match(dialog, /onOpenBuild:\(build:SavedBuild\)=>void/);
  assert.match(dialog, /Open saved build/);
  assert.match(dialog, /FolderOpen/);
  assert.match(source, /function requestOpenBuild\(b:SavedBuild\)\{setCompareOpen\(false\);if\(dirty\)setConfirm\(\{kind:"load",build:b\}\);else loadBuild\(b\);\}/);
  assert.match(source, /onOpenBuild=\{requestOpenBuild\}/);
});
