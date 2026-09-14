# Catalog Expansion Notes — September 13, 2026

This update keeps the original offline planner shape and adds a narrow, source-backed 2024 Sahara 4xe path. It does not claim blanket 2024, all-4xe, diesel, 392, Xtreme Recon, JK, JT or two-door fitment.

## Implemented

- Added `powertrain` to build state and catalog compatibility. Legacy saves and shared links without `powertrain` parse as `gas`.
- Added 20-inch starting wheel support for the first 2024 Sahara 4xe workflow.
- Added seven 20-inch Nitto Ridge Grappler variants for 2024 Sahara 4xe tire planning: `217670`, `217330`, `217630`, `217320`, `217150`, `217310` and `217290`.
- Added Mopar `77072522AE`, a 2-inch Jeep Performance Parts lift kit, for the 2024 Sahara 4xe planning path.
- Updated the Quadratec Morphic II wheel family to explicit `gas` and `4xe` powertrain coverage where the source lists 2018-2026 JL Unlimited four-door applications.
- Kept existing gas-only catalog records gas-only unless a source-backed 4xe record was added.

## Source Notes

- Mopar eStore 2024 Wrangler Sahara 4xe suspension category listed vehicle context as Sahara 4xe 2.0L electric/gas and listed Mopar Lift Suspension Kit `77072522AE` at $1,835.40: <https://store.mopar.com/v-2024-jeep-wrangler--sahara-4xe--2-0l-l4-electric-gas/performance--suspension-upgrades-and-components>
- Quadratec Nitto Ridge Grappler option table listed the added 20-inch part numbers and prices, including `217330` at $349.00 and the 20-inch family across published diameters 32-35 used here: <https://www.quadratec.com/p/nitto/ridge-grappler-tire/lt275/55r20-217330>
- Quadratec Morphic II page listed Wrangler Unlimited 4-Door JL years 2018 through 2026 and option prices of $249.99 for `92615-3835`, `92615-3570` and `92615-3830`: <https://www.quadratec.com/p/quadratec/morphic-ii-wheel-wrangler-jl-jk-gladiator-jt/black-machined-face>

All tire records remain dimensional planning records. The app still tells the customer to confirm approved rim width, load rating, clearance, TPMS and spare-carrier capacity with an installer before purchase.

## Competitor Notes

- Jeep's official Build & Price remains the customer benchmark for vehicle configuration flow and current factory-model framing: <https://www.jeep.com/vehicle-selector.bmo.html>
- ExtremeTerrain leans on year-first shopping and fitment filters, and its educational copy tells shoppers to consider the whole build scope when choosing lift, wheels and tires: <https://www.extremeterrain.com/jeep-accessories-parts.html>
- RealTruck exposes a large Wrangler JL catalog with vehicle selection, brand/category filters and a 3D builder prompt. Its scale reinforces that Jeep Build Lab should stay curated, transparent and source-backed instead of pretending to be a full marketplace: <https://realtruck.com/v/jeep/wrangler-jl/>

## Still Needed

- Installer review of the 2024 Sahara 4xe combinations.
- More 4xe-specific categories beyond tires, the first lift kit and Morphic wheels.
- Actual iPhone TestFlight validation of the vehicle switcher, excluded-card behavior, offline garage, share sheet and retailer-return flow.
