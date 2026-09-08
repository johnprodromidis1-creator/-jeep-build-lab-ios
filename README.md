# Jeep Build Lab
Mobile-first Wrangler JL build planner. Initial scope: 2018–2023 JL Unlimited 4-door, Sport/Sahara/Rubicon, 3.6L gasoline, standard suspension. Not for 4xe, diesel, 392 or Xtreme Recon.

## Implemented
- 43 sourced product variants across wheels, tires, suspension, front bumpers, winches and side armor.
- Original illustrative PNG vehicle and wheel layers; tire diameter, wheel finish and lift change the preview. Accessories are list-only.
- D1 garage with authenticated owner isolation, saved estimate snapshot, notes, save-as-copy, delete.
- D1 personal price overrides; curated specifications remain immutable.
- Quantity-aware totals, budget, labor and other allowances, CSV export, print sheet, URL configuration.
- Explicit trim, diameter and listed tire-limit conflicts, plus unresolved installation dependencies.
- No affiliate tracking, paid APIs, scraping pipeline, public audience or checkout.

## Catalog
lib/catalog.json contains variant records and dated source URLs. Facts were manually checked September 8, 2026. Prices are snapshots; no stock status promised. Descriptions are original. Generated illustrations are not branded product photographs.
Vehicle fitment is deliberately limited. Tires are size-based; wheel width/load/offset/brake/spare fit is not automatically established.
No legal or mechanical fitment certification is represented.

## Persistence
db/schema.ts -> generated migrations in drizzle/.
builds keyed by id and indexed by owner_id; every lookup/mutation checks oai-authenticated-user-id supplied by Sites.
price_notes keyed by owner_id + part_id.
API writes reject mismatched Origin. Zod validates client state and catalog references. Money uses integer cents.
Sharing serializes only supported BuildState, omitting private name, notes and custom prices. Site remains owner-private.

## Extending
Keep product identity/specifications separate from offers. Current source and personal quote are a minimal offer layer. Add retailer offer records keyed by part ID, then an affiliate link resolver, without changing selections.
For additional platforms introduce vehicle configurations and source-backed fitment rules; do not infer compatibility from the generation string alone.
Before public launch: finish catalog auditing and combinations with an experienced installer; obtain any needed image/feed licenses; add audience-appropriate privacy/affiliate disclosures and moderation/abuse controls if community features are introduced.

## Development
Run npm run db:generate when schema changes. Build with Sites build helper. Run node --test tests/model.test.mjs for core price/fitment validation (model test bundles with esbuild).
