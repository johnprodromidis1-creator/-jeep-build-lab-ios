# Jeep Build Lab — App Store preparation

Status: baseline unsigned iOS simulator compilation passed. Source prepared for an initial signed iOS device build; no signed IPA or TestFlight upload has been verified. The current source still requires a signed archive and physical-device tests.

## Implemented for the first iOS candidate

- Capacitor 8.5.1 iOS project with Swift Package Manager, shared Xcode scheme and iOS 17 minimum deployment target.
- Locally bundled React builder, catalog and PNG preview assets; no remote `server.url` or live website shell. The mobile content security policy denies application network connections.
- Device garage using IndexedDB: saved builds, price notes, automatic draft recovery, comparison and undo. Backups are important; app/browser storage and OS backups are not a guaranteed archival service.
- Native share sheet for build links, parts CSV and JSON backups; temporary exported files are removed from the app cache after sharing returns.
- Restore validated backups, explicitly confirm replacement, and delete all selected-garage data. Draft writes are paused and settled around replacement/deletion.
- Explicit New build resets remain eligible for autosave even when empty. Restore/erase reloads clear shared-build links so link data cannot override the chosen result. Native regression checks are still required.
- Budget, vehicle price, quote and current-tire fields retain unfinished input until blur or Done/Enter. Valid values update totals and autosave without reformatting what is being typed. Empty money fields become zero; invalid or out-of-range entries return to the last valid amount with an explanation when editing finishes. Money is parsed to integer cents, and grouped dollar amounts such as `1,250.50` are accepted.
- Retailer links open via the native Browser plugin; no in-app digital sales, ad SDKs, analytics SDKs, tracking or account requirement in the native application.
- In-app support and privacy text; web routes `/support` and `/privacy` intended as the App Store metadata URLs after publication.
- App icon derived from the project's JB monogram, dark launch screen, version 0.2.0 build 1, privacy manifest for Filesystem's app-owned file timestamp access.

The web version retains an optional ChatGPT cloud garage. Anonymous visitors use a clearly labeled device garage. Cloud export and deletion require the authenticated site user ID. The native app does not present ChatGPT login or use the cloud APIs.

## September 9 verification

TypeScript, the production web build, the offline mobile bundle and Capacitor sync pass. All 17 automated tests pass, including exact decimal-to-cent conversion, entry limits, price totals, device storage without network access, backup validation, draft revision conflicts and cloud owner isolation. The reset/shared-link and buffered-input paths were reviewed in source; their interactive regression steps remain pending in TESTFLIGHT.md. Shell syntax validation passes for the updated compile-check script. These checks do not establish Xcode compilation, native share-sheet behavior or physical-device usability.

## Remaining gates

On September 10, the owner supplied a screenshot confirming Codemagic compile-check run 1 passed in **2m 24s** on Mac mini M2 at GitHub commit `ac43eb5f912ea8d1b2be23982f5e319d4f90041e`. This predates the September 9 draft/input fixes and enhanced compiler artifacts. It confirms the native baseline, not a signed build of the current source. [Build evidence and next steps](CODEMAGIC.md)

| Gate | Status / next action |
| --- | --- |
| Apple signing account | Not connected to this environment. Reuse the owner's existing enrolled Apple account if available. |
| Codemagic | GitHub source transferred and app connected. First unsigned compile check passed; signed upload workflow is prepared. App-specific Apple registration/profile remains pending; see CODEMAGIC.md. |
| Bundle registration | `com.johnprodromidis.jeepbuildlab` is a proposed bundle identifier in source; registration/availability has not been verified. Confirm it before uploading. |
| Mac compilation | Baseline simulator compile passed at `ac43eb5`. Archive and sign the current `main` through the prepared Codemagic TestFlight workflow after signing setup. |
| Native functionality | Test actual iPhone/iPad startup, airplane-mode relaunch, keyboard, share sheet, file picker, restore, deletion, retailer return and lifecycle. |
| Brand/content rights | Final review of the app title and all catalog/image rights is still needed. The title uses Jeep; the independence notice is not a grant of trademark permission. An independent store name is an option. |
| Product coverage | Listing must say 2018–2023 JL Unlimited 4-door 3.6L gas only. The owner's 2024 Sahara 4xe remains unsupported until sourced fitment is added. |
| Data/fitment quality | Installer review of supported combinations and dated catalog claims remains necessary. No blanket compatibility or live-price promise. |
| Metadata | Draft provided; final title availability, age rating, privacy questionnaire, export compliance, copyright, territory/trader status and support details need account-owner review. |
| Screenshots | Capture the actual signed app in use. No generated UI screenshots have been prepared. |
| Accessibility | Evaluate VoiceOver, Larger Text, contrast, reduced motion and touch targets on devices. Do not claim Apple accessibility labels based only on CSS. |
| TestFlight | Upload a signed archive, finish processing/compliance, then add an internal tester. External testing may require Beta App Review. |
| App Review | Submit only after device testing and metadata verification. Approval cannot be guaranteed. |

## Current Apple references (checked September 8, 2026)

Apple requires Xcode 26 or later and the iOS 26 SDK or later for uploads since April 28, 2026. This is distinct from the app's iOS 17 minimum supported version. [SDK requirements](https://developer.apple.com/news/upcoming-requirements/)

The App Review Guidelines address complete submissions, useful app functionality beyond a repackaged website, accurate metadata, privacy and applicable account deletion. This builder's offline planning and native exports are intended to provide useful app functionality; Apple makes the review decision. [Guidelines](https://developer.apple.com/app-store/review/guidelines/)

[Privacy details](https://developer.apple.com/app-store/app-privacy-details/), [account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Capacitor iOS setup](https://capacitorjs.com/docs/ios), [Filesystem privacy manifest](https://capacitorjs.com/docs/apis/filesystem).
