# First TestFlight build

Use the owner's Apple Developer account. Do not paste signing certificates, private keys, account passwords or API keys into source files or chat. No paid build service has been provisioned.

## Preferred route: Codemagic

Use the owner's existing Codemagic account. The repository now includes a manual iOS archive/upload workflow and [Codemagic setup instructions](CODEMAGIC.md). The mobile GitHub repository, app-specific Apple record and provisioning profile still need to be connected before the first run. No personal Mac is required for that route.

## Alternative: on a Mac

1. Install Xcode 26 or later, its command-line tools, and Node 22 or later. Open Xcode once and complete its first-run setup. A paid Apple Developer Program membership is needed for TestFlight; an existing active membership can be reused.
2. Obtain the current repository source. The canonical repository is managed by Sites; it is not currently a connected GitHub Actions build project. Keep generated files and `node_modules` out of source control.
3. At the repository root, run `bash scripts/ios-verify.sh`. This installs the locked dependencies, bundles the app, syncs Capacitor plugins and compiles an unsigned simulator build. It has not been run here because this environment has no Xcode.
4. Run `npm run ios:open`. In Xcode choose the App target → Signing & Capabilities → your Apple team, with automatic signing. Confirm the Bundle Identifier before registration. The current proposed identifier is `com.johnprodromidis.jeepbuildlab`.
5. Run on your iPhone first. Complete the smoke tests below. Correct actual native issues before creating an archive.
6. In [App Store Connect](https://appstoreconnect.apple.com/), create this app's record using the matching registered Bundle ID. Do not reuse the records for the owner's other Jeep apps. Final name availability is not yet checked; choose a SKU unique to this app.
7. In Xcode select a generic iOS device destination, then Product → Archive. In Organizer validate and distribute to App Store Connect. Use Xcode's signed distribution flow. Increment the build number for subsequent uploads.
8. Wait for processing. Complete export-compliance and beta information accurately. In TestFlight, create/select an internal testing group, add the processed build, and add the owner as an eligible internal tester. Install through the TestFlight invitation or app. [Apple internal-testing instructions](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)

Codemagic is the selected Mac build service. Its first successful native run remains pending. The Sites web deployment does not create a TestFlight binary.

## Test one task at a time

| # | Task | Expected result | Status |
| --- | --- | --- | --- |
| 1 | Start a build, add a wheel option, save as “Test A,” close and reopen | Same build available in My garage without login | Pending on iPhone |
| 2 | Turn on airplane mode, fully close and reopen, change tire/lift, save “Test B” | Preview, catalog, prices, fitment and save work offline | Pending |
| 3 | Compare Test B with Test A, switch differing-parts filter | Correct option and cost differences | Pending |
| 4 | Mark one part owned and another buy later | Owned excluded from amount left to fund; later still included in final fitment checks | Pending |
| 5 | Share build link | Share sheet opens; copied/shared link contains chosen configuration and no build name or private notes | Pending |
| 6 | Export parts CSV and backup JSON to Files | Both files open and contain the intended quantities and records | Pending |
| 7 | Modify garage, restore the backup after confirming | Original backed-up records restored; newer device records replaced only after confirmation | Pending |
| 8 | Delete app data after exporting a backup | Garage and price overrides cleared; relaunch does not resurrect them | Pending |
| 9 | Open retailer page online and return | Correct retailer variant page; build preserved | Pending |
| 10 | Check privacy/help, large text, VoiceOver, keyboard and rotation | Content and buttons remain usable; contact link opens mail composer | Pending |

Do not delete useful personal builds during testing without a verified backup. Test cloud isolation separately on the website with distinct accounts; never use a shared database owner ID for guests.
