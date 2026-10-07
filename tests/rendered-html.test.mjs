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
  assert.match(html, /STARTER BUILDS/);
  assert.match(html, /source-backed owner-intent packs/i);
  assert.match(html, /low-cost visual refresh/i);
  assert.match(html, /beach-weekend 4xe plan/i);
  assert.match(html, /overland weekend plan/i);
  assert.match(html, /daily trail rim-and-tire plan/i);
  assert.match(html, /recovery-ready trail plan/i);
  assert.match(html, /Load a 2024 Sahara 4xe sample/);
  assert.match(html, /Save to my garage/);
  assert.match(html, /Filter by brand/);
  assert.match(html, /Filter by price/);
  assert.match(html, /Favorites only/);
  assert.match(html, /Fit \+ conflicts/);
  assert.match(html, /All loaded/);
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
  assert.match(privacy.html, /does not request camera, contacts, microphone, location or photo-library access/);
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

test("native engagement is opt-in and production ads stay configuration-gated", async () => {
  const settings = await readFile(new URL("../app/components/app-settings.tsx", import.meta.url), "utf8");
  const engagement = await readFile(new URL("../lib/engagement.ts", import.meta.url), "utf8");
  const ads = await readFile(new URL("../lib/ads.ts", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../app/components/privacy-content.tsx", import.meta.url), "utf8");
  assert.match(settings, /Spotlight notifications/);
  assert.match(settings, /setPartSpotlights/);
  assert.match(engagement, /requestPermissions/);
  assert.match(engagement, /length:18/);
  assert.match(engagement, /threeDays=3\*24\*60\*60\*1000/);
  assert.match(engagement, /\(index\+1\)\*threeDays/);
  assert.match(engagement, /scheduledUntil-Date\.now\(\)<=2\*threeDays/);
  assert.match(engagement, /LocalNotifications\.cancel/);
  assert.match(ads, /VITE_ADMOB_IOS_BANNER_ID/);
  assert.match(ads, /VITE_ADMOB_RELEASE_ENABLED==='true'/);
  assert.match(ads, /trackingAuthorizationStatus/);
  assert.match(ads, /tracking\.status==='notDetermined'/);
  assert.match(ads, /requestTrackingAuthorization/);
  assert.match(ads, /catch\(error\)\{\s*if\(enabled\)localStorage\.removeItem\(personalizationKey\)/);
  assert.match(ads, /npa:!personalized,isTesting:false/);
  assert.match(ads, /catch\{return false;\}/);
  assert.match(settings, /Allow personalized ads/);
  assert.match(settings, /setPersonalizedAds/);
  assert.doesNotMatch(ads, /ca-app-pub-3940256099942544/);
  assert.match(privacy, /Google Mobile Ads banner/);
  assert.match(privacy, /Google’s stored refusal, restricted or under-age treatment still applies/);
  assert.match(privacy, /scheduled locally on your device every three days/);
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
  assert.match(source, /function exportSavedSubmissionReview\(build:SavedBuild\)/);
  assert.match(source, /buildPartnerSubmissionReviewSheet\(\{name:build\.name,notes:build\.notes,state:build\.state,parts,\.\.\.partnerApplicationExportState\}\)/);
  assert.match(source, /Commerce options/);
  assert.match(source, /commerceSummaryForPart\(p\)/);
  assert.match(source, /Export parts CSV for/);
  assert.match(source, /Export submission review for/);
  assert.match(source, /FileSpreadsheet/);
  assert.match(source, /text\/csv;charset=utf-8/);
});
test("builder surfaces partner commerce disclosure and program links", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const partFamily = await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../app/components/privacy-content.tsx", import.meta.url), "utf8");
  const commerce = await readFile(new URL("../lib/commerce.ts", import.meta.url), "utf8");

  assert.match(source, /Partner commerce/);
  assert.match(source, /independenceDisclosure/);
  assert.match(source, /\["Independence disclosure",independenceDisclosure\]/);
  assert.match(source, /\{independenceDisclosure\} Affiliate links are inactive until approved/);
  assert.match(source, /Planning estimate/);
  assert.match(source, /Partner-ready offers/);
  assert.match(source, /affiliateApplicationProfileFields/);
  assert.match(source, /sponsoredLinkReadinessChecklist/);
  assert.match(source, /futureCheckoutReadinessChecklist/);
  assert.match(source, /commerceModeReadinessRows/);
  assert.match(source, /paidLinkDisclosureSnippet/);
  assert.match(source, /paidLinkLaunchChecklist/);
  assert.match(source, /paidLinkLaunchProofFields/);
  assert.match(source, /paidLinkLaunchStatus/);
  assert.match(source, /paidLinkLaunchLines/);
  assert.match(source, /partnerLaunchEvidenceRows/);
  assert.match(source, /partnerLaunchEvidence/);
  assert.match(source, /Sponsored-link readiness/);
  assert.match(source, /aria-label="Future checkout readiness"/);
  assert.match(source, /Future checkout guardrails/);
  assert.match(source, /No checkout is active/);
  assert.match(source, /aria-label="Commerce mode readiness"/);
  assert.match(source, /commerce-mode-map/);
  assert.match(source, /Unlock: \{row\.unlock\}/);
  assert.match(source, /aria-label="Paid-link launch status"/);
  assert.match(source, /aria-label="Paid-link launch proof"/);
  assert.match(source, /aria-label="Partner launch evidence"/);
  assert.match(source, /Launch proof before paid links/);
  assert.match(source, /Launch evidence to collect/);
  assert.match(source, /Keep tracking IDs and private partner credentials outside public source/);
  assert.match(source, /Paid-link disclosure/);
  assert.match(source, /Paid-link disclosure preview/);
  assert.match(source, /buildAffiliateApplicationProfile/);
  assert.match(source, /buildPaidLinkDisclosurePack/);
  assert.match(source, /exportPaidLinkDisclosure/);
  assert.match(source, /copyPaidLinkDisclosure/);
  assert.match(source, /partnerApplicationPrioritiesForBuild/);
  assert.match(source, /allPartnerApplicationPriorities/);
  assert.match(source, /partnerApplicationStorageKey/);
  assert.match(source, /partnerApplicationNotesStorageKey/);
  assert.match(source, /partnerApplicationStatusNames/);
  assert.match(source, /partnerApplicationTrackerStatusNames/);
  assert.match(source, /updatePartnerApplicationStatus/);
  assert.match(source, /cyclePartnerApplicationStatus/);
  assert.match(source, /advanceNextPartnerApplication/);
  assert.match(source, /pauseNextPartnerApplication/);
  assert.match(source, /blockNextPartnerApplication/);
  assert.match(source, /resetNextPartnerApplication/);
  assert.match(source, /resetPartnerApplication/);
  assert.match(source, /updatePartnerApplicationStatus\(programId,"todo",""\)/);
  assert.match(source, /defaultPartnerApplicationBlockerText/);
  assert.match(source, /defaultPartnerApplicationBlockerNote/);
  assert.match(source, /Impact account setup blocked/);
  assert.match(source, /An unknown error occurred/);
  assert.match(source, /Password format is invalid/);
  assert.match(source, /The account owner must fix the password\/account setup directly in Impact/);
  assert.match(source, /Partner Program Agreement acceptance advanced/);
  assert.match(source, /actionablePartnerApplications/);
  assert.match(source, /trackedPartnerApplications\.filter\(\(\{status\}\)=>status==="todo"\|\|status==="ready"\)/);
  assert.match(source, /actionablePartnerApplications\[0\]\?\?null/);
  assert.match(source, /nextPartnerApplication/);
  assert.match(source, /nextPartnerAnswerTarget/);
  assert.match(source, /partnerApplicationStatusCounts/);
  assert.match(source, /partnerApplicationExportState/);
  assert.match(source, /applicationStatusNotes:partnerApplicationNotes/);
  assert.match(source, /Suggested application order/);
  assert.match(source, /Apply first/);
  assert.match(source, /partnerApplicationPriorities\.length\?partnerApplicationPriorities\.map/);
  assert.match(source, /partnerApplicationStatusNames\[status\]/);
  assert.match(source, /No application is ready to pursue/);
  assert.match(source, /Application tracker/);
  assert.match(source, /Next application/);
  assert.match(source, /Partner application tracker/);
  assert.match(source, /Partner application status summary/);
  assert.match(source, /className="partner-status-summary"/);
  assert.match(source, /partnerApplicationStatusCounts\.map/);
  assert.match(source, /No unblocked partner application is next/);
  assert.match(source, /partner-status-list/);
  assert.match(source, /\{priority\.reason\}/);
  assert.match(source, /Track \$\{trackedPartnerApplications\.length\} program/);
  assert.match(source, /updatePartnerApplicationNote/);
  assert.match(source, /partner-status-row/);
  assert.match(source, /partner-status-note/);
  assert.match(source, /Application note/);
  assert.match(source, /maxLength=\{240\}/);
  assert.match(source, /Download profile/);
  assert.match(source, /Affiliate application profile preview/);
  assert.match(source, /Application answer kit/);
  assert.match(source, /Blocked application notes/);
  assert.match(source, /blocked-application-notes/);
  assert.match(source, /blockedPartnerApplications/);
  assert.match(source, /blockedPartnerApplications\.length>0/);
  assert.match(source, /blockedPartnerApplicationNotes/);
  assert.match(source, /blockedPartnerApplicationNotesText/);
  assert.match(source, /blockedPartnerSupportDraftText/);
  assert.match(source, /Paused application notes/);
  assert.match(source, /paused-application-notes/);
  assert.match(source, /pausedPartnerApplications/);
  assert.match(source, /pausedPartnerApplications\.length>0/);
  assert.match(source, /pausedPartnerApplicationNotes/);
  assert.match(source, /pausedPartnerApplicationNotesText/);
  assert.match(source, /copyBlockedApplicationNotes/);
  assert.match(source, /exportBlockedApplicationNotes/);
  assert.match(source, /copyPausedApplicationNotes/);
  assert.match(source, /exportPausedApplicationNotes/);
  assert.match(source, /copyBlockedApplicationSupportDraft/);
  assert.match(source, /exportBlockedApplicationSupportDraft/);
  assert.match(source, /openBlockedApplicationSupportEmail/);
  assert.match(source, /Copy blocked notes/);
  assert.match(source, /Share blocked notes/);
  assert.match(source, /Download blocked notes/);
  assert.match(source, /Open support email/);
  assert.match(source, /Copy support draft/);
  assert.match(source, /Share support draft/);
  assert.match(source, /Download support draft/);
  assert.match(source, /jeep-build-blocked-application-notes\.txt/);
  assert.match(source, /jeep-build-blocked-application-support-draft\.txt/);
  assert.match(source, /jeep-build-paused-application-notes\.txt/);
  assert.match(source, /Copy paused notes/);
  assert.match(source, /Share paused notes/);
  assert.match(source, /Download paused notes/);
  assert.match(source, /Next application target/);
  assert.match(source, /Target requirements/);
  assert.match(source, /application-answer-requirements/);
  assert.match(source, /application-answer-note/);
  assert.match(source, /requirements:nextPartnerApplication\.priority\.program\.requirements\?\?\[\]/);
  assert.match(source, /targetPrepText/);
  assert.match(source, /buildPartnerOutreachEmailDraft/);
  assert.match(source, /buildPartnerOutreachMailtoUrl/);
  assert.match(source, /buildBlockedApplicationSupportMailtoUrl/);
  assert.match(source, /buildPartnerSubmissionReviewSheet/);
  assert.match(source, /partnerSubmissionReviewChecklist/);
  assert.match(source, /copyTargetPrep/);
  assert.match(source, /copyTargetOutreachEmail/);
  assert.match(source, /openTargetOutreachEmail/);
  assert.match(source, /Open application/);
  assert.match(source, /Open email draft/);
  assert.match(source, /Email draft opened/);
  assert.match(source, /The email draft could not be opened/);
  assert.match(source, /Support email draft opened/);
  assert.match(source, /The support email draft could not be opened/);
  assert.match(source, /Mark profile ready/);
  assert.match(source, /Mark submitted/);
  assert.match(source, /Pause target/);
  assert.match(source, /Block target/);
  assert.match(source, /Reset target/);
  assert.match(source, /Reset to apply/);
  assert.match(source, /onClick=\{\(\)=>resetPartnerApplication\(priority\.program\.id\)\}/);
  assert.match(source, /Copy target prep/);
  assert.match(source, /Copy email draft/);
  assert.match(source, /Download review sheet/);
  assert.match(source, /Target prep copied/);
  assert.match(source, /Email draft copied/);
  assert.match(source, /Download the answer kit, then draft outreach from the text file/);
  assert.match(source, /Download the answer kit, then copy target details from the text file/);
  assert.match(source, /onPauseTarget=\{pauseNextPartnerApplication\}/);
  assert.match(source, /onBlockTarget=\{blockNextPartnerApplication\}/);
  assert.match(source, /onResetTarget=\{resetNextPartnerApplication\}/);
  assert.match(source, /onAdvanceTarget=\{advanceNextPartnerApplication\}/);
  assert.match(source, /onCopyTarget=\{copyTargetPrep\}/);
  assert.match(source, /onCopyEmail=\{copyTargetOutreachEmail\}/);
  assert.match(source, /onOpenEmail=\{openTargetOutreachEmail\}/);
  assert.match(source, /onExportReview=\{exportPartnerSubmissionReview\}/);
  assert.match(source, /target=\{nextPartnerAnswerTarget\}/);
  assert.match(source, /Common application answers/);
  assert.match(source, /affiliateApplicationAnswers\.slice\(0,3\)/);
  assert.match(source, /buildAffiliateApplicationAnswers/);
  assert.match(source, /navigator\.clipboard\.writeText\(buildAffiliateApplicationAnswers/);
  assert.match(source, /Copy answer kit/);
  assert.match(source, /Answer kit copied/);
  assert.match(source, /Download the answer kit, then copy from the text file/);
  assert.match(source, /jeep-build-affiliate-answer-kit\.txt/);
  assert.match(source, /Download answer kit/);
  assert.match(source, /Verify private business, tax and banking details inside the partner network/);
  assert.match(source, /Download the profile template or full application pack for partner review/);
  assert.match(source, /RealTruck path: Impact application/);
  assert.match(source, /Download application pack/);
  assert.match(source, /Download disclosure/);
  assert.match(source, /Copy disclosure/);
  assert.match(source, /Disclosure pack copied/);
  assert.match(source, /Download the disclosure, then copy from the text file/);
  assert.match(source, /jeep-build-paid-link-disclosure\.txt/);
  assert.match(source, /The paid-link disclosure could not be exported/);
  assert.match(source, /buildCommerceApplicationPack/);
  assert.match(source, /buildPartnerApplicationLinks/);
  assert.match(source, /buildPartnerApplicationTrackerCsv/);
  assert.match(source, /buildPartnerOutreachDraftPack/);
  assert.match(source, /exportPartnerApplicationTracker/);
  assert.match(source, /copyPartnerApplicationTracker/);
  assert.match(source, /buildPartnerApplicationTrackerText/);
  assert.match(source, /Copy tracker summary/);
  assert.match(source, /Tracker summary copied/);
  assert.match(source, /exportPartnerOutreachDrafts/);
  assert.match(source, /jeep-build-partner-application-tracker\.csv/);
  assert.match(source, /jeep-build-partner-outreach-drafts\.txt/);
  assert.match(source, /The application tracker could not be exported/);
  assert.match(source, /The outreach drafts could not be exported/);
  assert.match(source, /exportPartnerSubmissionReview/);
  assert.match(source, /jeep-build-partner-submission-review\.txt/);
  assert.match(source, /The submission review sheet could not be exported/);
  assert.match(source, /partnerProgramsForBuild/);
  assert.match(source, /copyPartnerLinks/);
  assert.match(source, /Partner links copied/);
  assert.match(source, /Download partner links, then copy from the text file/);
  assert.match(source, /Copy partner links/);
  assert.match(source, /Download tracker CSV/);
  assert.match(source, /Download application tracker/);
  assert.match(source, /Download outreach drafts/);
  assert.match(source, /Download submission review/);
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
  assert.match(source, /Affiliate links are inactive until approved, tested and labeled/);
  assert.match(partFamily, /commerce paths/);
  assert.match(partFamily, /partner programs ready for this category/);
  assert.match(privacy, /Commerce and affiliate disclosure/);
  assert.match(privacy, /independenceDisclosure/);
  assert.match(privacy, /no affiliate tracking, wholesale checkout or dropship fulfillment is active/);
  assert.match(commerce, /export const independenceDisclosure/);
  assert.match(commerce, /Not affiliated with Jeep, Stellantis, retailers or listed parts brands/);
  assert.match(commerce, /Jeep Build Lab partner application pack/);
  assert.match(commerce, /Jeep Build Lab partner application links/);
  assert.match(commerce, /buildPartnerApplicationTrackerCsv/);
  assert.match(commerce, /buildPartnerOutreachDraftPack/);
  assert.match(commerce, /buildPartnerSubmissionReviewSheet/);
  assert.match(commerce, /Jeep Build Lab partner application tracker/);
  assert.match(commerce, /buildPartnerApplicationTrackerText/);
  assert.match(commerce, /Jeep Build Lab partner outreach draft pack/);
  assert.match(commerce, /Jeep Build Lab partner submission review sheet/);
  assert.match(commerce, /Draft count/);
  assert.match(commerce, /Tracker status/);
  assert.match(commerce, /Next action/);
  assert.match(commerce, /Network: \$\{program\.network\}/);
  assert.match(commerce, /affiliateApplicationAnswers/);
  assert.match(commerce, /Jeep Build Lab affiliate application answer kit/);
  assert.match(commerce, /Affiliate application profile fields/);
  assert.match(commerce, /Next application target/);
  assert.match(commerce, /buildPartnerOutreachEmailDraft/);
  assert.match(commerce, /buildPartnerOutreachMailtoUrl/);
  assert.match(commerce, /buildBlockedApplicationSupportMailtoUrl/);
  assert.match(commerce, /Next outreach email draft/);
  assert.match(commerce, /Subject: Jeep Build Lab partner application/);
  assert.match(commerce, /Current commerce posture: links are reference and application links only/);
  assert.match(commerce, /Common application answers/);
  assert.match(commerce, /Fulfillment role/);
  assert.match(commerce, /partnerApplicationTrackerStatusNames/);
  assert.match(commerce, /Application tracker/);
  assert.match(commerce, /Tracker note/);
  assert.match(commerce, /Blocked application follow-up/);
  assert.match(commerce, /Application tracker summary/);
  assert.match(commerce, /Next application/);
  assert.match(commerce, /Submission review checklist/);
  assert.match(commerce, /Owner-private or legal fields to verify/);
  assert.match(commerce, /Suggested owner approval line/);
  assert.match(commerce, /Profile ready/);
  assert.match(commerce, /Submitted/);
  assert.match(commerce, /Approved/);
  assert.match(commerce, /Blocked/);
  assert.match(commerce, /Resolve password, account, eligibility or partner-site errors/);
  assert.match(commerce, /Password format is invalid/);
  assert.match(commerce, /keeps Continue disabled before the account-details step advances/);
  assert.match(commerce, /Sponsored-link readiness/);
  assert.match(commerce, /futureCheckoutReadinessChecklist/);
  assert.match(commerce, /Future checkout guardrails/);
  assert.match(commerce, /Stripe-hosted checkout or Payment Links/);
  assert.match(commerce, /commerceModeReadinessRows/);
  assert.match(commerce, /Commerce mode readiness/);
  assert.match(commerce, /Stripe \/ payment checkout/);
  assert.match(commerce, /paidLinkDisclosureSnippet/);
  assert.match(commerce, /paidLinkLaunchChecklist/);
  assert.match(commerce, /paidLinkLaunchProofFields/);
  assert.match(commerce, /paidLinkLaunchStatus/);
  assert.match(commerce, /function partnerLaunchEvidenceRows/);
  assert.match(commerce, /Partner launch evidence/);
  assert.match(commerce, /Paid-link launch status/);
  assert.match(commerce, /Launch proof to verify/);
  assert.match(commerce, /Partner-issued tracking URL stored outside public source/);
  assert.match(commerce, /Jeep Build Lab paid-link disclosure pack/);
  assert.match(commerce, /Pre-publish paid-link checks/);
  assert.match(commerce, /Paid-link disclosure snippet/);
  assert.match(commerce, /Application prep checklist/);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.sponsor-readiness/);
  assert.match(css, /\.future-checkout-readiness/);
  assert.match(css, /\.future-checkout-readiness ul/);
  assert.match(css, /\.commerce-mode-map/);
  assert.match(css, /\.commerce-mode-row\.checkout/);
  assert.match(css, /\.paid-launch-status/);
  assert.match(css, /\.paid-launch-proof/);
  assert.match(css, /\.paid-launch-proof ul/);
  assert.match(css, /\.paid-disclosure-preview/);
  assert.match(css, /\.paid-disclosure-preview \[data-slot=button\]/);
  assert.match(css, /\.application-profile-preview/);
  assert.match(css, /\.submission-review-preview/);
  assert.match(css, /\.application-answer-kit/);
  assert.match(css, /\.application-answer-target/);
  assert.match(css, /\.application-answer-note/);
  assert.match(css, /\.blocked-application-notes/);
  assert.match(css, /\.blocked-application-notes div/);
  assert.match(css, /\.blocked-application-notes p \[data-slot=button\]/);
  assert.match(css, /\.blocked-application-notes \[data-slot=button\]/);
  assert.match(css, /\.paused-application-notes/);
  assert.match(css, /\.paused-application-notes div/);
  assert.match(css, /\.paused-application-notes p \[data-slot=button\]/);
  assert.match(css, /\.paused-application-notes \[data-slot=button\]/);
  assert.match(css, /\.application-answer-requirements/);
  assert.match(css, /\.application-answer-actions/);
  assert.match(css, /\.partner-priority/);
  assert.match(css, /\.priority-program/);
  assert.match(css, /\.partner-status-tracker/);
  assert.match(css, /\.partner-status-summary/);
  assert.match(css, /\.partner-next-link/);
  assert.match(css, /\.partner-next-complete/);
  assert.match(css, /\.partner-status-list/);
  assert.match(css, /\.partner-status-row/);
  assert.match(css, /\.partner-status/);
  assert.match(css, /\.partner-status-note/);
  assert.match(css, /\.partner-status-note::placeholder/);
  assert.match(css, /\.partner-status\.blocked strong/);
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

test("part cards surface key specs for faster comparison", async () => {
  const partFamily = await readFile(new URL("../app/components/part-family.tsx", import.meta.url), "utf8");
  const model = await readFile(new URL("../lib/model.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(model, /function inchLabel/);
  assert.match(model, /export function partSpecBadges/);
  assert.match(model, /mm offset/);
  assert.match(model, /lb pull/);
  assert.match(partFamily, /partSpecBadges\(p\)/);
  assert.match(partFamily, /className="spec-badges"/);
  assert.match(partFamily, /aria-label="Key part specs"/);
  assert.match(css, /\.spec-badges/);
  assert.match(css, /\.spec-badges span/);
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
  assert.match(source, /installerQuoteChecklist/);
  assert.match(source, /installerQuoteItems=installerQuoteChecklist\(\{notes,state,parts\}\)/);
  assert.match(source, /aria-label="Installer quote checklist"/);
  assert.match(source, /Installer quote checklist/);
  assert.match(source, /installerQuoteItems\.map/);
  assert.match(css, /\.quote-readiness/);
  assert.match(css, /\.quote-readiness\.needs-review/);
  assert.match(css, /\.installer-quote-checklist/);
  assert.match(css, /\.installer-quote-row\.needs-review/);
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

test("build summary surfaces a dependency-aware advisory build order", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const planning = await readFile(new URL("../lib/planning.ts", import.meta.url), "utf8");
  const shopBrief = await readFile(new URL("../lib/shop-brief.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /aria-label="Advisory build order"/);
  assert.match(source, /advisoryBuildOrder=buildOrder\(state,parts\)/);
  assert.match(source, /installer approves or revises the final sequence/i);
  assert.match(planning, /export function buildOrder/);
  assert.match(planning, /Set stance and geometry/);
  assert.match(shopBrief, /Advisory build order/);
  assert.match(css, /\.build-order/);
});

test("build summary exposes a category completion checklist", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /const buildChecklist=categories\.map\(c=>\(\{category:c,part:selected\.find\(p=>p\.category===c\),ready:categoryStats\[c\]\.ready\}\)\)/);
  assert.match(source, /aria-label="Build category checklist"/);
  assert.match(source, /Build checklist/);
  assert.match(source, /\{selected\.length\} of \{categories\.length\} categories selected/);
  assert.match(source, /buildChecklist\.map\(row=>\{const Icon=icons\[row\.category\]/);
  assert.match(source, /onClick=\{\(\)=>reviewCategory\(row\.category\)\}/);
  assert.match(source, /row\.part\?"Swap":"Browse"/);
  assert.match(css, /\.build-checklist/);
  assert.match(css, /\.build-checklist-row\.picked/);
  assert.match(css, /\.build-checklist-row small/);
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
  assert.match(source, /const advisorProofItems=/);
  assert.match(source, /aria-label="Neutral advisor proof"/);
  assert.match(source, /Proof for quotes/);
  assert.match(source, /No active paid links/);
  assert.match(source, /Exports include source URL, checked date, coverage and price basis/);
  assert.match(source, /aria-label="Source confidence"/);
  assert.match(source, /Planner fitment is coverage, not certification/);
  assert.match(source, /Planner coverage/);
  assert.match(partFamily, /aria-label="Part source confidence"/);
  assert.match(partFamily, /Checked \{sourceCheckedLabel\(p\.checkedAt\)\}/);
  assert.match(shopBrief, /export function installerQuoteChecklist/);
  assert.match(shopBrief, /Installer quote checklist/);
  assert.match(shopBrief, /Price basis: \$\{priceBasis\(part\)\}/);
  assert.match(shopBrief, /Planner coverage: \$\{partCoverage\(part\)\}/);
  assert.match(commerce, /Price basis: \$\{priceBasis\(part\)\}/);
  assert.match(commerce, /Planner coverage: \$\{partCoverage\(part\)\}/);
  assert.match(css, /\.source-status/);
  assert.match(css, /\.source-badges/);
  assert.match(css, /\.source-confidence/);
  assert.match(css, /\.advisor-proof/);
  assert.match(css, /\.advisor-proof-row\.ready/);
  assert.match(css, /\.advisor-proof-row\.needs-review/);
});

test("builder shows submitted and approved partner launch follow-up", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /function partnerLaunchFollowupText/);
  assert.match(source, /launchPartnerApplications=trackedPartnerApplications\.filter\(\(\{status\}\)=>status==="submitted"\|\|status==="approved"\)/);
  assert.match(source, /aria-label="Submitted and approved application follow-up"/);
  assert.match(source, /Submitted \/ approved follow-up/);
  assert.match(source, /Keep paid links inactive until every approved tracking URL is partner-issued, tested and visibly labeled/);
  assert.match(source, /Copy disclosure pack/);
  assert.match(source, /Share disclosure pack/);
  assert.match(source, /Download disclosure pack/);
  assert.match(source, /aria-label="Partner launch evidence"/);
  assert.match(source, /Launch evidence to collect/);
  assert.match(source, /launch-evidence-row/);
  assert.match(css, /\.launch-application-notes/);
  assert.match(css, /\.launch-evidence-list/);
  assert.match(css, /\.launch-evidence-row\.approved/);
  assert.match(css, /\.launch-evidence-row\.submitted/);
  assert.match(css, /\.launch-application-notes div/);
  assert.match(css, /\.launch-application-notes \[data-slot=button\]/);
});

test("part detail dialog can directly update the build selection", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /buildErrorsForOption/);
  assert.match(source, /function partSelectionSummary\(part:Part,state:BuildState,parts:Part\[\]\)/);
  assert.match(source, /const detailSelection=detail\?partSelectionSummary\(detail,state,parts\):null/);
  assert.match(source, /aria-label="Part selection action"/);
  assert.match(source, /detailSelection\.active\?"selected":detailSelection\.excluded\?"blocked":detailSelection\.conflicts\.length\?"warning":""/);
  assert.match(source, /disabled=\{!!detailSelection\.excluded&&!detailSelection\.active\}/);
  assert.match(source, /onClick=\{\(\)=>selectPart\(detail\)\}/);
  assert.match(source, /detailSelection\.active\?<><Trash2 size=\{15\}\/>Remove<\/>:<><Plus size=\{15\}\/>\{detailSelection\.action\}<\/>/);
  assert.match(css, /\.detail-action-row/);
  assert.match(css, /\.detail-action-row\.warning/);
  assert.match(css, /@media\(max-width:600px\).*\.detail-action-row\{grid-template-columns:1fr\}/);
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

test("catalog surfaces a current-category market snapshot", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const model = await readFile(new URL("../lib/model.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(model, /export function linePriceRangeLabel/);
  assert.match(source, /categoryMarketRange=linePriceRangeLabel\(categoryPool,state\)/);
  assert.match(source, /aria-label="Current category market snapshot"/);
  assert.match(source, /shown of \{currentCategoryStats\.loaded\} loaded/);
  assert.match(source, /selection range/);
  assert.match(source, /ready for this build/);
  assert.match(css, /\.catalog-market/);
  assert.match(css, /\.catalog-market strong/);
  assert.match(css, /@media\(max-width:430px\).*\.catalog-market\{grid-template-columns:1fr\}/);
});

test("catalog inventory makes loaded category depth scannable", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /categoryInventory=categories\.map\(c=>\{/);
  assert.match(source, /linePriceRangeLabel\(categoryParts,state\)/);
  assert.match(source, /aria-label="Catalog inventory by category"/);
  assert.match(source, /\{row\.loaded\} loaded · \{row\.ready\} ready/);
  assert.match(source, /aria-pressed=\{active\}/);
  assert.match(source, /onClick=\{\(\)=>changeCategory\(row\.category\)\}/);
  assert.match(css, /\.catalog-inventory\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css, /\.inventory-tile\.picked/);
  assert.match(css, /@media\(max-width:1100px\)\{\.catalog-inventory\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}\}/);
  assert.match(css, /@media\(max-width:760px\).*\.catalog-inventory\{display:flex;overflow:auto/);
});

test("catalog proves the fifteen choice target in the picker", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /catalogDepthTarget=15/);
  assert.match(source, /categoryDepthRows=categories\.map\(c=>\{const stats=categoryStats\[c\]/);
  assert.match(source, /blocked:stats\.blocked,excluded:stats\.excluded/);
  assert.match(source, /aria-label="Catalog 15 choice depth proof"/);
  assert.match(source, /aria-label="Current category visibility breakdown"/);
  assert.match(source, /\{currentDepth\.ready\}<\/strong> ready/);
  assert.match(source, /\{currentDepth\.blocked\}<\/strong> need combo/);
  assert.match(source, /\{currentDepth\.excluded\}<\/strong> vehicle excluded/);
  assert.match(source, /Meets the \$\{catalogDepthTarget\}\+ choice target/);
  assert.match(source, /Show all \{currentDepth\.loaded\}/);
  assert.match(source, /className=\{`\$\{row\.active\?"active":""\} \$\{row\.meets\?"meets":"short"\}`\}/);
  assert.match(css, /\.catalog-depth-proof/);
  assert.match(css, /\.depth-breakdown/);
  assert.match(css, /\.depth-chip-list button\.meets strong/);
  assert.match(css, /@media\(max-width:760px\).*\.catalog-depth-proof\{grid-template-columns:1fr/);
});

test("catalog view switch exposes ready conflict and all-loaded modes", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /catalogView=showExcluded\?"all":showBuildConflicts\?"review":"ready"/);
  assert.match(source, /function showConflictCatalogChoices\(\)\{setShowExcluded\(false\);setShowBuildConflicts\(true\);\}/);
  assert.match(source, /role="group" aria-label="Catalog view"/);
  assert.match(source, /aria-pressed=\{catalogView==="ready"\}/);
  assert.match(source, /Fit \+ conflicts/);
  assert.match(source, /All loaded/);
  assert.match(source, /\{buildConflicting\.length>0&&<em>\{buildConflicting\.length\}<\/em>\}/);
  assert.match(css, /\.catalog-view-switch/);
  assert.match(css, /\.catalog-view-switch button\[aria-pressed=true\]/);
  assert.match(css, /@media\(max-width:760px\).*\.catalog-view-switch\{order:4;width:100%;flex-basis:100%\}/);
  assert.match(css, /@media\(max-width:390px\).*\.catalog-view-switch button\{font-size:11px/);
});

test("catalog defaults to best-fit sorting", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const filters = await readFile(new URL("../lib/catalog-filters.ts", import.meta.url), "utf8");

  assert.match(filters, /catalogSortOptions/);
  assert.match(filters, /Best fit first/);
  assert.match(filters, /export function catalogFitScore/);
  assert.match(filters, /export function compareCatalogParts/);
  assert.match(source, /useState<CatalogSort>\("fit"\)/);
  assert.match(source, /compareCatalogParts\(sort,state,parts\)/);
  assert.match(source, /catalogSortOptions\.map/);
});

test("rims stay browseable before a matching tire choice", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /rimFirstBrowsing=category==="wheels"&&!state\.picks\.tires/);
  assert.match(source, /browseReady=rimFirstBrowsing\?compatible:buildReady/);
  assert.match(source, /showExcluded\?categoryMatches:showBuildConflicts\?compatible:browseReady/);
  assert.match(source, /Rim-first browsing keeps every vehicle-compatible rim visible/);
  assert.match(css, /\.rim-first-note/);
  assert.match(css, /\.rim-first-note svg/);
});

test("rim-first conflicts can jump straight to matching tires", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /selectedRimDiameter=wheel\?\.specs\.rim\?\?state\.stockRim/);
  assert.match(source, /wheelNeedsMatchingTires=!!wheel&&!tire&&selectedRimDiameter!==state\.stockRim/);
  assert.match(source, /function browseMatchingTires\(rim:number=selectedRimDiameter\)/);
  assert.match(source, /setCategory\("tires"\)/);
  assert.match(source, /setDimensionFilter\(`rim:\$\{rim\}`\)/);
  assert.match(source, /setSort\("fit"\)/);
  assert.match(source, /Find \{selectedRimDiameter\}-inch tires/);
  assert.match(source, /canMatchTires=issue\.category==="tires"&&wheelNeedsMatchingTires/);
  assert.match(css, /\.rim-first-note \[data-slot=button\]/);
  assert.match(css, /\.catalog-reveal,\.rim-first-note\{align-items:flex-start;flex-direction:column\}/);
});

test("stance guidance jumps to matching rims and supporting suspension", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /tireNeedsMatchingRims=!!tire&&!wheel&&selectedTireRimDiameter!==state\.stockRim/);
  assert.match(source, /oversizedTireNeedsLift=!!tire&&!lift&&selectedTireDiameter>state\.stockTire\+\.2/);
  assert.match(source, /tireExceedsLift=!!tire&&!!lift&&selectedLiftLimit!==undefined&&selectedTireDiameter>selectedLiftLimit/);
  assert.match(source, /function browseMatchingRims\(rim:number=selectedTireRimDiameter\)/);
  assert.match(source, /setCategory\("wheels"\)/);
  assert.match(source, /function browseSupportingLift\(\)/);
  assert.match(source, /setCategory\("lift"\)/);
  assert.match(source, /aria-label="Stance match next steps"/);
  assert.match(source, /Find \{selectedTireRimDiameter\}-inch rims/);
  assert.match(source, /Find supporting suspension/);
  assert.match(source, /Find stronger suspension/);
  assert.match(css, /\.stance-next/);
  assert.match(css, /\.stance-action/);
});

test("builder shows an adaptive next-best-pick guide", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /const nextOpenCategory=\(\["bumpers","winches","armor"\] as Category\[\]\)\.find/);
  assert.match(source, /const nextPick=wheelNeedsMatchingTires\?/);
  assert.match(source, /title:"Start with rims"/);
  assert.match(source, /title:"Choose tires next"/);
  assert.match(source, /title:"Check suspension clearance"/);
  assert.match(source, /title:"Ready for shop quotes"/);
  assert.match(source, /aria-label="Next best build step"/);
  assert.match(source, /NEXT BEST PICK/);
  assert.match(source, /onClick=\{nextPick\.onClick\}/);
  assert.match(css, /\.build-coach/);
  assert.match(css, /\.build-coach \[data-slot=button\]/);
});

test("builder exposes complete starter build recipes", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const recipes = await readFile(new URL("../lib/build-recipes.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /buildRecipes\.map\(recipe=>/);
  assert.match(source, /function loadRecipe\(recipe:BuildRecipe/);
  assert.match(source, /function requestRecipe\(recipe:BuildRecipe\)/);
  assert.match(source, /confirm\?\.kind==="recipe"/);
  assert.match(source, /aria-label="Starter build recipes"/);
  assert.match(source, /source-backed owner-intent packs/);
  assert.match(recipes, /Low-cost visual refresh/);
  assert.match(recipes, /Daily trail starter/);
  assert.match(recipes, /Beach weekend 4xe/);
  assert.match(recipes, /Overland weekend recovery/);
  assert.match(recipes, /Recovery-ready trail build/);
  assert.match(recipes, /2024 Sahara 4xe starter/);
  assert.match(css, /repeat\(auto-fit,minmax\(205px,1fr\)\)/);
  assert.match(css, /\.recipe-list/);
  assert.match(css, /\.recipe-row/);
  assert.match(css, /@media\(max-width:900px\).*\.recipe-list\{grid-template-columns:1fr\}/);
});

test("catalog advisor picks surface fit price and source-path choices", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /function uniqueCatalogHighlights/);
  assert.match(source, /catalogAdvisorPool=filtered\.filter/);
  assert.match(source, /bestFitPick=\[...catalogAdvisorPool\]\.sort\(compareCatalogParts\("fit",state,parts\)\)\[0\]/);
  assert.match(source, /lowestShownPick=\[...catalogAdvisorPool\]\.sort/);
  assert.match(source, /mostPathsPick=\[...catalogAdvisorPool\]\.sort/);
  assert.match(source, /label:"Best fit"/);
  assert.match(source, /label:"Lowest shown"/);
  assert.match(source, /label:"Most source paths"/);
  assert.match(source, /aria-label="Catalog advisor picks"/);
  assert.match(source, /onClick=\{\(\)=>openDetail\(highlight\.part\)\}/);
  assert.match(css, /\.catalog-highlights/);
  assert.match(css, /\.catalog-highlight/);
  assert.match(css, /@media\(max-width:760px\).*\.catalog-highlights\{grid-template-columns:1fr\}/);
});

test("catalog advisor picks can be compared side by side", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /partSpecBadges/);
  assert.match(source, /function partSpecSummary\(part:Part\)/);
  assert.match(source, /catalogHighlights\.length>1&&<details className="catalog-compare"/);
  assert.match(source, /aria-label="Compare catalog advisor picks"/);
  assert.match(source, /Compare advisor picks/);
  assert.match(source, /Selection price/);
  assert.match(source, /Checked \{sourceCheckedLabel\(highlight\.part\.checkedAt\)\}/);
  assert.match(source, /partCoverage\(highlight\.part\)/);
  assert.match(source, /onClick=\{\(\)=>openDetail\(highlight\.part\)\}/);
  assert.match(css, /\.catalog-compare/);
  assert.match(css, /\.catalog-compare-scroll\{overflow:auto/);
  assert.match(css, /\.catalog-compare table\{width:100%;min-width:620px/);
});

test("catalog advisor picks can directly update the build", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /function advisorActionLabel\(part:Part,state:BuildState\)\{return state\.picks\[part\.category\]\?"Replace":"Add";\}/);
  assert.match(source, /catalogHighlights\.map\(highlight=>\{const active=state\.picks\[highlight\.part\.category\]===highlight\.part\.id;return <div className=\{`catalog-highlight \$\{active\?"selected":""\}`\}/);
  assert.match(source, /className="catalog-highlight-actions"/);
  assert.match(source, /onClick=\{\(\)=>selectPart\(highlight\.part\)\}/);
  assert.match(source, /active\?<><CheckCheck size=\{13\}\/>Added<\/>:advisorActionLabel\(highlight\.part,state\)/);
  assert.match(css, /\.catalog-highlight\.selected/);
  assert.match(css, /\.catalog-highlight-actions\{display:flex/);
  assert.match(css, /\.catalog-highlight-actions \[data-slot=button\]\{flex:1;min-width:104px\}/);
});

test("catalog visibility controls can reveal every loaded choice", async () => {
  const source = await readFile(new URL("../app/builder.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /currentCategoryStats=categoryStats\[category\]/);
  assert.match(source, /hiddenByCatalogView=currentCategoryStats\.loaded>filtered\.length/);
  assert.match(source, /showingFullCategory=showExcluded&&!activeCatalogFilter&&filtered\.length===currentCategoryStats\.loaded/);
  assert.match(source, /function showAllCategoryChoices\(\)\{clearCatalogFilters\(\);setShowBuildConflicts\(false\);setShowExcluded\(true\);\}/);
  assert.match(source, /function showReadyCatalogChoices\(\)\{setShowExcluded\(false\);setShowBuildConflicts\(false\);\}/);
  assert.match(source, /aria-label="Catalog visibility controls"/);
  assert.match(source, /Show all loaded/);
  assert.match(source, /Ready only/);
  assert.match(source, /hidden by fitment, build or filter settings/);
  assert.match(css, /\.catalog-reveal/);
  assert.match(css, /\.catalog-reveal-actions/);
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
