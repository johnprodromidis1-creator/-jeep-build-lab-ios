# App Store listing draft — not submitted

App name: Jeep Build Lab (working name; verify availability and brand rights)
Subtitle: Plan your next JL upgrade
Primary category proposal: Utilities
Version: 0.2.0 (TestFlight candidate)
Support URL after publication: https://jeep-build-lab.johnprodromidis1.chatgpt.site/support
Privacy URL after publication: https://jeep-build-lab.johnprodromidis1.chatgpt.site/privacy
Support contact: John Prodromidis — johnprodromidis1@gmail.com
Copyright proposal: 2026 John Prodromidis

## Description

Plan your Wrangler JL upgrades with a curated parts catalog, an illustrative build preview and a running budget.

Choose wheels, tires, suspension, bumpers, winches and side armor. Compare two build plans, include a matching spare, enter price quotes, and split purchases into buy now, buy later, already owned or installed.

Save builds on your iPhone without an account. The bundled catalog, preview, calculations and device garage work offline. Export a parts list, back up your garage, or share a configuration link when you are ready.

Coverage: 2018–2023 Wrangler JL Unlimited four-door, 3.6L gasoline, Sport/Sahara/Rubicon with standard factory suspension as the starting point, plus first-batch 2024 Sahara 4xe catalog support. TJ, JK, JT, two-door, diesel, 392, Xtreme Recon and other 4xe trims are not supported in this release.

Prices are dated snapshots or your own quotes, not live retailer inventory. The preview uses generic wheel illustrations; some accessories appear in the parts list only. Automated checks do not certify fitment. Have a qualified installer confirm the complete combination and installation sequence.

Independent aftermarket planning software. Not affiliated with Jeep, Stellantis or the parts brands shown.

## Reviewer notes draft

No account or demo credentials are required for the iOS app. The device garage and catalog operate locally. To test: tap Load starter for the included 2024 Sahara 4xe sample, confirm excluded parts display with reasons, save a named build, create another configuration and compare; use Settings for backup, restore, data deletion, privacy and support. Retailer links open a browser; there is no in-app checkout or digital purchase. The optional signed-in cloud garage belongs to the separate browser website and is not available inside this iOS version.

The app includes planning calculations and fitment rules, a bundled illustrative preview, saved configurations, purchase stages, native file/link sharing and offline operation. It does not load the live website as the application UI.

## Privacy questionnaire preparation

Native code currently sends no build records to an app server and contains no ad/analytics SDKs or tracking. The Filesystem plugin accesses app-owned temporary export files; the declared required-API reason is C617.1. Do not automatically label the whole service “Data Not Collected”: review the final archive, native Browser behavior, support-email handling, platform logs and any added SDKs against Apple's current definitions and optional-disclosure exceptions before answering App Store Connect. The website's cloud account/data flow is distinct from the native build.

No camera, microphone, photo-library, location, contacts or notification permission is requested. File sharing is user-initiated. Reassess these statements if any capability or SDK changes.

Encryption configuration: `ITSAppUsesNonExemptEncryption = false` reflects this candidate's lack of custom/non-exempt encryption implementation; external HTTPS uses platform services. Confirm the final archive and questionnaire before upload.

Age rating: complete the current Apple questionnaire for the actual final content. Do not invent a rating. This is not a Kids Category app. Accessibility feature declarations also require actual evaluation.
