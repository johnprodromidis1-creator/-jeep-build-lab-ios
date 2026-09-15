import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
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
  assert.match(html, /Quote readiness/);
  assert.match(html, /Purchase stages/);
  assert.match(html, /Load a 2024 Sahara 4xe sample/);
  assert.match(html, /Save to my garage/);
  assert.match(html, /Filter by brand/);
  assert.match(html, /Filter by price/);
  assert.match(html, /Favorites only/);
  assert.match(html, /Rims/);
  assert.match(html, /Search Rims/i);
  assert.match(html, /RIMS/);
  assert.match(html, /104(?:<!-- -->)? curated variants/);
  assert.match(html, /104 sourced variants - latest check Sep 15, 2026/);
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

test("garage cards can duplicate a saved build without opening the current draft", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");

  assert.match(source, /function duplicateSavedBuild\(build:SavedBuild\)/);
  assert.match(source, /copiedBuildName\(build\.name\)/);
  assert.match(source, /state:structuredClone\(build\.state\)/);
  assert.match(source, /setGarage\(v=>\[\{\.\.\.build,id:saved\.id,name:copyName,updatedAt:new Date\(\)\.toISOString\(\),savedTotal:saved\.savedTotal\},\.\.\.v\]\)/);
  assert.match(source, /Duplicate saved build/);
  assert.match(source, /CopyPlus/);
});

test("builder surfaces the shop brief export", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");

  assert.match(source, /buildShopBrief/);
  assert.match(source, /exportSavedShopBrief/);
  assert.match(source, /Download shop brief/);
  assert.match(source, /Share shop brief/);
  assert.match(source, /Export shop brief for/);
});

test("garage cards can export saved-build parts CSV files", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");

  assert.match(source, /function buildPartsCsv\(\{name,notes,state,parts\}/);
  assert.match(source, /function exportSavedCSV\(build:SavedBuild\)/);
  assert.match(source, /buildPartsCsv\(\{name:build\.name,notes:build\.notes,state:build\.state,parts\}\)/);
  assert.match(source, /Commerce options/);
  assert.match(source, /commerceSummaryForPart\(p\)/);
  assert.match(source, /Export parts CSV for/);
  assert.match(source, /FileSpreadsheet/);
  assert.match(source, /text\/csv;charset=utf-8/);
});
test("builder surfaces partner commerce disclosure and program links", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const partFamily = await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../app/components/privacy-content.tsx", import.meta.url), "utf8");
  const commerce = await readFile(new URL("../lib/commerce.ts", import.meta.url), "utf8");

  assert.match(source, /Partner commerce/);
  assert.match(source, /Partner-ready offers/);
  assert.match(source, /buildCommerceApplicationPack/);
  assert.match(source, /buildPartnerApplicationLinks/);
  assert.match(source, /partnerProgramsForBuild/);
  assert.match(source, /Download commerce pack/);
  assert.match(source, /Download partner links/);
  assert.match(source, /applications for selected parts/);
  assert.match(source, /Select parts to narrow applications/);
  assert.match(source, /Selected source links/);
  assert.match(source, /aria-label="Selected source links"/);
  assert.match(source, /Source link/);
  assert.match(source, /Export commerce pack for/);
  assert.match(source, /ClipboardList/);
  assert.match(source, /partnerPrograms\.length/);
  assert.match(source, /Application links do not create a sale, commission or dealer order/);
  assert.match(partFamily, /commerce paths/);
  assert.match(partFamily, /partner programs ready for this category/);
  assert.match(privacy, /Commerce and affiliate disclosure/);
  assert.match(privacy, /no affiliate tracking, wholesale checkout or dropship fulfillment is active/);
  assert.match(commerce, /Jeep Build Lab partner application pack/);
  assert.match(commerce, /Jeep Build Lab partner application links/);
  assert.match(commerce, /Application prep checklist/);
});

test("vehicle edits warn before selected parts become invalid", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");

  assert.match(source, /function vehicleChangeWarning\(next:BuildState\)/);
  assert.match(source, /function requestVehicleUpdate\(patch:Partial<BuildState>\)/);
  assert.match(source, /setConfirm\(\{kind:"vehicle",patch,warning\}\)/);
  assert.match(source, /Confirm vehicle change/);
  assert.match(source, /Change vehicle/);
  assert.match(source, /Vehicle changes that affect selected parts ask for confirmation first/);
});

test("catalog supports device-local favorite parts filtering", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const partFamily = await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /favoriteStorageKey/);
  assert.match(source, /localStorage\.getItem\(favoriteStorageKey\)/);
  assert.match(source, /localStorage\.setItem\(favoriteStorageKey/);
  assert.match(source, /Favorites only/);
  assert.match(source, /setFavoritesOnly\(false\)/);
  assert.match(source, /favoritePartIds\.has\(p\.id\)/);
  assert.match(source, /favoriteIds=\{favoritePartIds\}/);
  assert.match(partFamily, /Star/);
  assert.match(partFamily, /aria-pressed=\{favorite\}/);
  assert.match(partFamily, /onFavorite\(p\)/);
  assert.match(css, /\.favorite-button/);
});

test("part catalog uses thumbnail images beside parts", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const partFamily = await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8");
  const helper = await readFile(new URL("../lib/part-images.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const partSheet = await stat(new URL("../public/assets/part-thumbnails.png", import.meta.url));
  const tireImage = await stat(new URL("../public/assets/tire-thumbnail.png", import.meta.url));

  assert.ok(partSheet.size > 10000);
  assert.ok(tireImage.size > 10000);
  assert.match(helper, /partThumbnail/);
  assert.match(helper, /tire-thumbnail\.png/);
  assert.match(helper, /part-thumbnails\.png/);
  assert.match(partFamily, /partThumbnail\(p\)/);
  assert.match(partFamily, /className=\{`part-art \$\{thumbnail\.className\}`\}/);
  assert.match(source, /summary-thumb/);
  assert.match(source, /detail-part-art/);
  assert.match(css, /\.part-thumb-sprite\.bumpers img/);
  assert.match(css, /\.summary-thumb/);
  assert.match(css, /\.part-dialog-hero/);
});

test("build summary surfaces quote readiness actions", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /const readinessState=/);
  assert.match(source, /aria-label="Quote readiness"/);
  assert.match(source, /Ready for quote/);
  assert.match(source, /Needs fitment review/);
  assert.match(source, /Review first issue/);
  assert.match(source, /Download shop brief/);
  assert.match(source, /partner application/);
  assert.match(css, /\.quote-readiness/);
  assert.match(css, /\.quote-readiness\.needs-review/);
});

test("build summary breaks costs into purchase stages", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /const stageBreakdown=/);
  assert.match(source, /aria-label="Purchase stage breakdown"/);
  assert.match(source, /first phase incl\. allowances/);
  assert.match(source, /stageNames\[row\.stage\]/);
  assert.match(source, /Labor, tax, shipping and extras/);
  assert.match(css, /\.stage-breakdown/);
  assert.match(css, /\.stage-breakdown-row\.now/);
  assert.match(css, /\.stage-breakdown-row\.allowances/);
});

test("builder surfaces source confidence and export proof fields", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const partFamily = await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8");
  const model = await readFile(new URL("../lib/model.ts", import.meta.url), "utf8");
  const shopBrief = await readFile(new URL("../lib/shop-brief.ts", import.meta.url), "utf8");
  const commerce = await readFile(new URL("../lib/commerce.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(model, /function sourceCheckedLabel/);
  assert.match(model, /function sourceFreshnessSummary/);
  assert.match(model, /function priceBasis/);
  assert.match(source, /aria-label="Catalog source status"/);
  assert.match(source, /catalogSourceText/);
  assert.match(source, /aria-label="Build source evidence"/);
  assert.match(source, /Source evidence checked through/);
  assert.match(source, /aria-label="Source confidence"/);
  assert.match(source, /Planner fitment is coverage, not certification/);
  assert.match(source, /Planner coverage/);
  assert.match(partFamily, /aria-label="Part source confidence"/);
  assert.match(partFamily, /Checked \{sourceCheckedLabel\(p\.checkedAt\)\}/);
  assert.match(shopBrief, /Price basis: \$\{priceBasis\(part\)\}/);
  assert.match(shopBrief, /Planner coverage: \$\{partCoverage\(part\)\}/);
  assert.match(commerce, /Price basis: \$\{priceBasis\(part\)\}/);
  assert.match(commerce, /Planner coverage: \$\{partCoverage\(part\)\}/);
  assert.match(css, /\.source-status/);
  assert.match(css, /\.source-badges/);
  assert.match(css, /\.source-confidence/);
});

test("catalog category tabs show build-ready and loaded choice counts", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /categoryStats/);
  assert.match(source, /loaded:0,ready:0,fit:0,blocked:0,excluded:0/);
  assert.match(source, /optionAddsBuildError\(part,state,parts\)/);
  assert.match(source, /className="tab-count"/);
  assert.match(source, /title=\{`\$\{stats\.ready\} ready for this build; \$\{stats\.loaded\} loaded`\}/);
  assert.match(source, /aria-label=\{`\$\{stats\.ready\} ready choices, \$\{stats\.loaded\} loaded choices`\}/);
  assert.match(source, /<strong>\{stats\.ready\}<\/strong><small>of \{stats\.loaded\}<\/small>/);
  assert.match(css, /\.tab-count/);
  assert.match(css, /\.tab-count small/);
  assert.match(css, /\.category-tabs \[data-state=active\] \.tab-count/);
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
