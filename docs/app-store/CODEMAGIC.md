# Codemagic → first internal TestFlight build

The owner uses Codemagic for existing apps. This repository contains manual `jeep-ios-verify` and `jeep-ios-testflight` workflows. No signed IPA or TestFlight build for Jeep Build Lab has been verified.

## Current handoff — September 9, 2026

- All 153 source files were transferred to GitHub, with an exact Git tree match against the saved Sites source. Subsequent workflow/documentation changes were also synchronized to both repositories.
- [Unsigned iOS compile check, run 1](https://codemagic.io/app/6aa099218e0d886361fff68a/build/6aa099f29dd87df8a76864c9) started September 8 at 19:27 EDT from GitHub commit `ac43eb5f912ea8d1b2be23982f5e319d4f90041e`. The last observed status was **building**. The browser connection closed during the Apple sign-in step; the final compile result has **not** been verified. Inspect that run before starting another.
- Codemagic's fetched Apple profile list contained the owner's other apps but no profile for `com.johnprodromidis.jeepbuildlab`. Apple Developer registration required a fresh sign-in. That sign-in was not verified, and this session did not create an Apple identifier, app record or signing profile.
- The browser remains signed out of Codemagic after an unsuccessful GitHub login return. A manual sign-in handoff was offered. No second build or signed upload was started. Repository access for saving source remains available independently.
- Release-preparation fixes preserve a deliberately empty new draft on reopen and clear shared-build links after restoring or erasing garage data. Device validation remains pending; see the regression steps in TESTFLIGHT.md.
- Next: inspect run 1's result/logs. Then finish this app's Apple identifier, App Store Connect record and profile before using the TestFlight workflow. The compile-check run cannot be installed through TestFlight.

## Connect the source first

The canonical source is saved in the existing Sites repository. That source credential is short-lived and is not suitable as a permanent Codemagic checkout credential. The website URL is not a source repository URL.

The owner created [johnprodromidis1-creator/-jeep-build-lab-ios](https://github.com/johnprodromidis1-creator/-jeep-build-lab-ios). The leading hyphen is part of its name. Its visibility is public. This is the mobile build destination for the committed source, including `codemagic.yaml`, the lockfile and `ios/`. Keep the current Sites origin for website development. Do not use the existing `thats-ducked-up-ios` repository: it is a different app. Signing keys and private runtime data do not belong in either repository.

The repository is connected in the owner's existing Codemagic personal account as an Ionic/Capacitor app. [Open its Codemagic settings](https://codemagic.io/app/6aa099218e0d886361fff68a/settings). Codemagic loaded `codemagic.yaml` from `main` successfully.

The **Jeep Build Lab — iOS compile check** workflow checks TypeScript, then runs an unsigned simulator compilation using the locked dependencies and bundled offline app. It needs no Apple signing profile and produces no installable TestFlight build. Future runs retain the compiler log and Xcode result bundle under the build's artifacts, including when compilation fails. The script uses `pipefail` so retaining a log cannot turn a failed compile into a successful result. Use it to resolve native compilation errors while setting up signing.

## Reuse the Apple account, with a profile for this app

- The upload workflow references `spice_czar_apple`, the integration name found in the owner's existing `thats-ducked-up-ios/codemagic.yaml`. Codemagic's existing distribution certificate is `spice_czar_distribution`, for john prodromidis, expiring August 29, 2027. No API key or private certificate contents are in this repository.
- Register the proposed Bundle ID `com.johnprodromidis.jeepbuildlab` in that Apple team. Create a **separate** app record in [App Store Connect](https://appstoreconnect.apple.com/apps) with that exact Bundle ID. Working name: Jeep Build Lab; suggested SKU: `jeep-build-lab-ios`. Name availability is unverified. Do not select another app's record.
- In Codemagic Team settings → codemagic.yaml settings → Code signing identities, reuse an existing valid Apple Distribution certificate whose private key is available to Codemagic. Add/fetch an **App Store provisioning profile for this exact Bundle ID**, signed by that certificate. A profile for Spice Czar or That's Ducked Up cannot sign this app. Do not revoke certificates used by the other apps.
- The `ios_signing` selector loads signing files matching this app's bundle identifier and `app_store` distribution type. `xcode-project use-profiles` applies them to the generated Xcode project. [Codemagic signing guide](https://docs.codemagic.io/yaml-code-signing/signing-ios/)

## First build

1. Verify the Apple app record, integration and matching provisioning profile exist before spending build minutes.
2. In the Codemagic app, choose **Start new build**, branch **main**, workflow **Jeep Build Lab — TestFlight**.
3. The workflow installs locked packages, checks TypeScript, bundles the offline app, syncs Capacitor's Swift packages, validates the app identity and sets a new build number. It then archives, signs and uploads the IPA using Codemagic's App Store Connect integration. Xcode 26.6 and Node 24.19.0 match the owner's existing iOS workflow; adjust only if Codemagic retires that image.
4. Open the build details. A successful archive alone is insufficient: confirm the App Store Connect publishing step also succeeded. Downloadable IPA and Xcode logs remain build artifacts. No emails or external tester invitations are configured in this workflow.
5. In App Store Connect → this app → TestFlight, wait for Apple processing, answer any missing compliance questions, and add the build to the owner's **internal** group. Enable automatic distribution for that internal group if desired. The workflow uploads but deliberately leaves beta-review and App Store-review submission disabled. `submit_to_testflight` is Codemagic's beta-review option; setting it false does not disable the binary upload. [Publishing reference](https://docs.codemagic.io/yaml-publishing/app-store-connect/)
6. Install through TestFlight and perform **test 1 only** in [TESTFLIGHT.md](TESTFLIGHT.md), then continue one task at a time.

Build numbers use Codemagic's project-wide `PROJECT_BUILD_NUMBER + BUILD_NUMBER_OFFSET + 1`. Rebuilds therefore get a new value. `BUILD_NUMBER_OFFSET` defaults to zero. If the Codemagic app is recreated or a higher build was uploaded elsewhere, set an offset large enough to exceed the latest uploaded number before retrying. The script stops rather than producing a five-digit single-component version. [Codemagic build variables](https://docs.codemagic.io/yaml-basic-configuration/environment-variables/)

No automatic push triggers or paid plan changes are configured. The upload workflow timeout is 45 minutes and the compile-check timeout is 30 minutes; actual consumption depends on the build and the owner's existing allowance. Codemagic's currently saved profiles cover other apps, so this app's matching profile must be added before a signed upload. Local checks cannot substitute for a successful Mac archive.
