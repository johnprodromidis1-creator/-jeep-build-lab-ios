# Jeep Build Lab
Mobile-first Wrangler JL build planner. Initial scope: 2018–2023 JL Unlimited 4-door, Sport/Sahara/Rubicon, 3.6L gasoline, standard suspension, plus first-batch 2024 Sahara 4xe catalog support. Not for diesel, 392, Xtreme Recon, TJ, JK, JT or two-door builds.

## Build for TestFlight with Codemagic

The iOS build destination is [johnprodromidis1-creator/-jeep-build-lab-ios](https://github.com/johnprodromidis1-creator/-jeep-build-lab-ios). The leading hyphen is part of the repository name. Add this repository to the owner's Codemagic team and select the `jeep-ios-testflight` workflow on `main`. Before spending build minutes, confirm GitHub `main` contains the current source from this checkout/Sites repository; publishing the website does not update the GitHub mobile build branch. Follow [the Codemagic setup guide](docs/app-store/CODEMAGIC.md) to connect this app's Apple record and provisioning profile before starting a build. No signed build has been verified yet.

## Implemented
- 51 sourced product variants across wheels, tires, suspension, front bumpers, winches and side armor.
- Original illustrative PNG vehicle and wheel layers; tire diameter, wheel finish and lift change the preview. Accessories are list-only.
- D1 garage with authenticated owner isolation, saved estimate snapshot, notes, save-as-copy, delete.
- D1 personal price overrides; curated specifications remain immutable.
- Quantity-aware totals, budget, labor and other allowances, CSV export, print sheet, URL configuration.
- Explicit year, trim, powertrain, diameter and listed tire-limit conflicts, plus unresolved installation dependencies.
- Three-step navigation, grouped product families with variant selectors, quantity-inclusive card prices and replacement price deltas.
- First-time 2024 Sahara 4xe starter build that loads a sourced tire/lift plan on stock 20-inch wheels while preserving saved garage entries.
- Side-by-side current/saved build comparison with differing-parts filter; both columns use the same catalog and personal quotes.
- Buy now/later/owned/installed stages, remaining upgrade budget and optional user-entered vehicle price. All allowances are reserved in the first phase; installation sequence is not verified.
- Owner-scoped D1 draft recovery with debounced writes and revision checks to prevent stale tab/device overwrites; explicit failure/retry states. Named garage snapshots remain separate.
- Twenty configuration undo steps per session. Fitment conflicts appear above the preview with review links, including retained-tire/new-wheel mismatches.
- No affiliate tracking, paid APIs, scraping pipeline or checkout.

## Catalog
lib/catalog.json contains variant records and dated source URLs. Facts were manually checked September 8 and September 13, 2026. Prices are snapshots; no stock status promised. Descriptions are original. Generated illustrations are not branded product photographs. The September 13 update adds explicit powertrain fitment, seven 20-inch Ridge Grappler options for the 2024 Sahara 4xe path, a Mopar 4xe lift kit and documented Morphic wheel coverage through current JL Unlimited listings.
Vehicle fitment is deliberately limited. Tires are size-based; wheel width/load/offset/brake/spare fit is not automatically established. 4xe support is limited to the records explicitly marked for that powertrain.
No legal or mechanical fitment certification is represented.

Source notes and competitor observations: `docs/catalog-expansion-2026-09-13.md`.

## Persistence
db/schema.ts -> generated migrations in drizzle/.
builds keyed by id and indexed by owner_id; every lookup/mutation checks oai-authenticated-user-id supplied by Sites.
price_notes keyed by owner_id + part_id.
build_drafts keyed by owner_id; writes use an expected revision and return 409 instead of overwriting a newer draft. Appends migration 0001; the original migration is unchanged. Existing saved and linked state gains default purchase stages and vehicle price through Zod parsing.
API writes reject mismatched Origin. Zod validates client state and catalog references. Money uses integer cents.
Sharing serializes only supported BuildState, omitting private name, notes and custom prices. The website is public; anonymous visitors use device storage, and cloud records require their authenticated owner.

## Extending
Keep product identity/specifications separate from offers. Current source and personal quote are a minimal offer layer. Add retailer offer records keyed by part ID, then an affiliate link resolver, without changing selections.
For additional platforms introduce vehicle configurations and source-backed fitment rules; do not infer compatibility from the generation string alone.
Before public launch: finish catalog auditing and combinations with an experienced installer; obtain any needed image/feed licenses; add audience-appropriate privacy/affiliate disclosures and moderation/abuse controls if community features are introduced.

## Development
Run npm run db:generate when schema changes. Build with Sites build helper. Run node --test tests/*.test.mjs for core price, fitment, storage and rendered-HTML validation.

## Build & Price benchmark
Official Jeep Build & Price (https://www.jeep.com/bmo.html) is the benchmark for clear vehicle configuration and pricing. This app focuses on aftermarket ownership planning: compatible combinations, staged purchases, owner-supplied quotes and comparison of saved options. No claim is made that Jeep lacks any particular feature or that its full interactive flow has been browser-tested.

Version 2 preserves the limited vehicle/catalog scope and illustrative preview. Pricing, compatibility and owner-isolation tests cover the planning features. The September 14 public Sites deployment was smoke-tested in-browser for the starter 4xe flow, fitment summary, support page and privacy page. No paid service was added.

## iOS / App Store preparation (0.2.0)

The native project is in `ios/App/App.xcodeproj`; the separately bundled React entry is `mobile/main.tsx`. `npm run ios:sync` builds the offline assets and updates Capacitor. The app targets iOS 17+ and requires Xcode 26+ for the current upload rules. Codemagic runs lint and native-safe regression tests before both unsigned iOS verification and signed TestFlight archive/upload. No signed IPA or TestFlight upload has been produced.

Anonymous website visitors and the iOS app use `lib/storage/device.ts`; the website's authenticated cloud garage uses `lib/storage/cloud.ts` and the original owner-isolated APIs. Settings includes backup, device restore, data erasure, support and privacy. Do not expose cloud data to solve anonymous access. `/api/catalog` returns the public source catalog to guests, never another owner's quotes.

Current preparation and test instructions: `docs/app-store/CODEMAGIC.md`, `READINESS.md`, `TESTFLIGHT.md`, `SCREENSHOTS.md`, `LISTING-DRAFT.md`. The native candidate uses device storage; existing web cloud records remain accessible on the website. The owner's existing Codemagic account is the selected build service. No paid plan change was made.
