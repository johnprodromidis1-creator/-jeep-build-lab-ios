# Codemagic → first internal TestFlight build

The owner uses Codemagic for existing apps. This repository now contains a manual `jeep-ios-testflight` workflow. It has not yet run on Codemagic; no signed IPA or TestFlight build for Jeep Build Lab has been verified.

## Connect the source first

The canonical source is saved in the existing Sites repository. That source credential is short-lived and is not suitable as a permanent Codemagic checkout credential. The website URL is not a source repository URL.

The owner created [johnprodromidis1-creator/-jeep-build-lab-ios](https://github.com/johnprodromidis1-creator/-jeep-build-lab-ios). The leading hyphen is part of its name. Its visibility is public. This is the mobile build destination for the committed source, including `codemagic.yaml`, the lockfile and `ios/`. Keep the current Sites origin for website development. Do not use the existing `thats-ducked-up-ios` repository: it is a different app. Signing keys and private runtime data do not belong in either repository.

In [Codemagic Applications](https://codemagic.io/apps), select the same team used by the owner's other apps, add the new GitHub repository, choose the Capacitor/Ionic project type if offered, and use the repository's `codemagic.yaml`. If the repository is absent, allow the Codemagic GitHub integration access to that specific repository.

## Reuse the Apple account, with a profile for this app

- The workflow references `spice_czar_apple`, the integration name found in the owner's existing `thats-ducked-up-ios/codemagic.yaml`. Confirm it is still available in the selected Codemagic team and corresponds to the intended Apple Developer team. If its name differs, change only the integration reference. No API key contents are in this repository.
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

No automatic push triggers or paid plan changes are configured. The workflow timeout is 45 minutes; actual consumption depends on the build and the owner's existing allowance. The next external blocker is adding the mobile repository to Codemagic and confirming signing; local checks cannot substitute for a successful Mac archive.
