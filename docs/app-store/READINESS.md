# Jeep Build Lab — App Store preparation

Status: baseline unsigned iOS simulator compilation passed. Source prepared for an initial signed iOS device build; no signed IPA or TestFlight upload has been verified. The current source now includes first-batch 2024 Sahara 4xe catalog support, and the public Sites build is live at https://jeep-build-lab.johnprodromidis1.chatgpt.site. A signed archive and physical-device tests are still required before TestFlight/App Store submission.

## Implemented for the first iOS candidate

- Capacitor 8.5.1 iOS project with Swift Package Manager, shared Xcode scheme and iOS 17 minimum deployment target.
- Locally bundled React builder, catalog and PNG preview assets; no remote `server.url` or live website shell. The mobile content security policy denies application network connections.
- Device garage using IndexedDB: saved builds, price notes, automatic draft recovery, saved-build duplication, comparison with direct saved-build open, undo, search, sort and fitment-status filters. Backups are important; app/browser storage and OS backups are not a guaranteed archival service.
- Native share sheet for build links, current and saved-build shop briefs, commerce packs, current and saved-build parts CSV and JSON backups; temporary exported files are removed from the app cache after sharing returns.
- Restore validated backups, explicitly confirm replacement, and delete all selected-garage data. Draft writes are paused and settled around replacement/deletion.
- Explicit New build resets remain eligible for autosave even when empty. Restore/erase reloads clear shared-build links so link data cannot override the chosen result. Physical-device regression checks are still required.
- Budget, vehicle price, quote and current-tire fields retain unfinished input until blur or Done/Enter. Valid values update totals and autosave without reformatting what is being typed. Empty money fields become zero; invalid or out-of-range entries return to the last valid amount with an explanation when editing finishes. Money is parsed to integer cents, and grouped dollar amounts such as `1,250.50` are accepted.
- Retailer and partner-program links open via the native Browser plugin. The commerce directory and application-pack export are prepared for source, affiliate, reseller, dealer and distributor paths, but no in-app digital sales, active affiliate tracking, wholesale checkout, dropship fulfillment, ad SDKs, analytics SDKs or account requirement is present in the native application.
- In-app support and privacy text; published web routes `/support` and `/privacy` are ready to use as the App Store metadata URLs after account-owner review.
- App icon derived from the project's JB monogram, dark launch screen, version 0.2.0 build 1, privacy manifest for Filesystem's app-owned file timestamp access.

The web version retains an optional ChatGPT cloud garage. Anonymous visitors use a clearly labeled device garage. Cloud export and deletion require the authenticated site user ID. The native app does not present ChatGPT login or use the cloud APIs.

## September 13 source update

- Added explicit powertrain support to build state and catalog records. Legacy saved builds and drafts without a powertrain parse as 3.6L V6 gas.
- Added first-batch 2024 Sahara 4xe vehicle selection, 20-inch starting wheel support, seven 20-inch Nitto Ridge Grappler variants, a Mopar 4xe lift kit and updated Morphic wheel fitment records.
- The catalog now shows compatible and excluded variants deliberately. Excluded cards keep their detail/source links and explain the year, trim or powertrain reason before purchase.
- Added a first-time 2024 Sahara 4xe starter build that loads a sourced tire/lift sample on stock 20-inch wheels, with confirmation before replacing an unsaved draft.
- Hardened Codemagic iOS verification so both the unsigned compile-check path and the signed TestFlight workflow run release preflight, lint and the native-safe regression tests before archive/upload.
- Restricted build-link sharing to this app's public `#build=` URLs and normalized native export filenames before temporary Filesystem writes.
- Shared links, backups, drafts and saves now reject purchase-stage entries that do not have a matching selected part.
- Mutating API routes now return explicit client errors for malformed JSON instead of treating bad request bodies like server failures.
- The owner reports `com.johnprodromidis.jeepbuildlab` is registered with Apple. App Store Connect app record, Codemagic matching provisioning profile, signed archive and TestFlight upload remain unverified.

## September 13-14 verification

TypeScript passes with `node node_modules/typescript/bin/tsc --noEmit`. ESLint exits successfully with no warnings after documenting the offline image strategy and ignoring generated worker typings. Production `vinext build` passes. The offline mobile Vite bundle passes with the existing large main-chunk warning. `npm run release:preflight` passes the source-side App Store guardrails. `node --test tests/*.test.mjs` passes 48 tests, including device-garage isolation, cloud owner isolation, catalog count, 4xe powertrain fitment, the starter build sample, current-build conflict filtering, catalog brand/price/spec filters, commerce partner directory/disclosure/application-pack checks, garage search/sort/fitment filters, saved-build duplication, compare-dialog saved-build opening, current and saved-build shop brief/commerce pack/parts CSV export, rendered HTML metadata, support/privacy page rendering, shared-link privacy, API malformed-request handling, native Bundle ID/version settings, privacy-manifest packaging, offline mobile shell CSP, Capacitor Swift Package Manager wiring, platform link/export handling, mobile toast placement above the sticky build-sheet bar, app-owned non-submit button declarations, App Store preflight and Codemagic iOS workflow guardrails.

Capacitor `sync ios` succeeded after a local-only monkeypatch for Node's `os.userInfo()` failing with `ENOMEM` in this Windows sandbox. The sync copied generated mobile assets, but those outputs are intentionally ignored and rebuilt in CI. Running the normal Codemagic/npm path on macOS remains the authoritative iOS sync/archive check.

On September 14, the public Sites deployment succeeded and the live URL was smoke-tested in the in-app browser. The builder rendered the 51-variant catalog, loaded the 2024 Sahara 4xe starter build, showed the Nitto tire and Mopar lift with $4,150.40 left to fund, reported no fitment conflicts while retaining three shop-confirmation checks, and served the live `/privacy` and `/support` pages without console errors.

On September 14, TestFlight build attempt 1 started from GitHub `main` at `c8e787c` and failed before archive/signing because Codemagic found no matching App Store provisioning profile for `com.johnprodromidis.jeepbuildlab`.

## September 9 verification

At that point, TypeScript, the production web build, the offline mobile bundle and Capacitor sync passed. The then-current 17 automated tests covered exact decimal-to-cent conversion, entry limits, price totals, device storage without network access, backup validation, draft revision conflicts and cloud owner isolation. Later September 13-14 work expanded the suite to 48 tests and added 4xe, current-build conflict filtering, catalog filters, commerce partner directory/disclosure/application-pack checks, garage filters, saved-build duplication, compare-dialog saved-build opening, current and saved-build shop brief/commerce pack/parts CSV export, platform, API, mobile layout, app-owned button and iOS workflow guardrails. These checks do not establish Xcode compilation, native share-sheet behavior or physical-device usability.

## Remaining gates

On September 10, the owner supplied a screenshot confirming Codemagic compile-check run 1 passed in **2m 24s** on Mac mini M2 at GitHub commit `ac43eb5f912ea8d1b2be23982f5e319d4f90041e`. This predates the September 9 draft/input fixes and enhanced compiler artifacts. It confirms the native baseline, not a signed build of the current source. [Build evidence and next steps](CODEMAGIC.md)

| Gate | Status / next action |
| --- | --- |
| Apple signing account | Not connected to this environment. Reuse the owner's existing enrolled Apple account if available. |
| Codemagic | GitHub source transferred and app connected. First unsigned compile check passed; signed upload workflow is prepared and now confirmed to run from current `main`. The latest TestFlight attempt failed before archive because the matching App Store provisioning profile is missing. Add the app-specific profile, then retry; see CODEMAGIC.md. |
| Bundle registration | Owner-reported registered Bundle ID: `com.johnprodromidis.jeepbuildlab`. App Store Connect app record and matching provisioning profile are still unverified in this environment. |
| Mac compilation | Baseline simulator compile passed at `ac43eb5`. Archive and sign the current `main` through the prepared Codemagic TestFlight workflow after signing setup. |
| Native functionality | Test actual iPhone/iPad startup, airplane-mode relaunch, keyboard, share sheet, file picker, restore, deletion, retailer return and lifecycle. |
| Brand/content rights | Final review of the app title and all catalog/image rights is still needed. The title uses Jeep; the independence notice is not a grant of trademark permission. An independent store name is an option. |
| Product coverage | Listing must say 2018–2023 JL Unlimited 4-door 3.6L gas plus first-batch 2024 Sahara 4xe catalog support only. Do not imply blanket 4xe or all-2024 fitment. |
| Data/fitment quality | Installer review of supported combinations and dated catalog claims remains necessary. No blanket compatibility or live-price promise. |
| Metadata | Draft provided; final title availability, age rating, privacy questionnaire, export compliance, copyright, territory/trader status and support details need account-owner review. |
| Screenshots | Capture the actual signed app in use. The starter build gives a truthful 2024 Sahara 4xe scenario; use the [screenshot plan](SCREENSHOTS.md) for required device sizes and capture order. |
| Accessibility | Evaluate VoiceOver, Larger Text, contrast, reduced motion and touch targets on devices. Do not claim Apple accessibility labels based only on CSS. |
| TestFlight | Upload a signed archive, finish processing/compliance, then add an internal tester. External testing may require Beta App Review. |
| App Review | Submit only after device testing and metadata verification. Approval cannot be guaranteed. |

## Current Apple references (checked September 8 and September 13, 2026)

Apple requires Xcode 26 or later and the iOS 26 SDK or later for uploads since April 28, 2026. This is distinct from the app's iOS 17 minimum supported version. [SDK requirements](https://developer.apple.com/news/upcoming-requirements/)

The App Review Guidelines address complete submissions, useful app functionality beyond a repackaged website, accurate metadata, privacy and applicable account deletion. This builder's offline planning and native exports are intended to provide useful app functionality; Apple makes the review decision. [Guidelines](https://developer.apple.com/app-store/review/guidelines/)

[Privacy details](https://developer.apple.com/app-store/app-privacy-details/), [account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Capacitor iOS setup](https://capacitorjs.com/docs/ios), [Filesystem privacy manifest](https://capacitorjs.com/docs/apis/filesystem).

Apple's App Store Connect screenshot help was rechecked September 13, 2026 for the current iPhone and iPad capture targets documented in [SCREENSHOTS.md](SCREENSHOTS.md).
