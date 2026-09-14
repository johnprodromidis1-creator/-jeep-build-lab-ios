# AdMob in the beta builds

This branch adds a fixed Google AdMob test banner to Debug and TestFlight builds.
The SDK and its sample IDs are pinned in `NativePackages/TestFlightAds`.
The package is referenced directly by Xcode so Capacitor synchronization does not remove it.

Release builds use Apple's sandbox receipt, or (when it is missing) verified
StoreKit app-transaction information on iOS 16 and later. A verified sandbox
transaction enables test ads on a fresh TestFlight install without a receipt.
Production receipts/transactions and unverified transactions keep ads off.
An unavailable lookup keeps ads off and can retry on the next foreground event.
There is no production ad-unit ID, remote switch, or live-ad request path in this integration.
These banners do not generate advertising revenue.

The banner reserves 58 points after successful loading, hides while the keyboard
is displayed, and restores the full viewport after a failed request. Capacitor's
existing controller remains a child, retaining its scanner, StoreKit, sharing,
status-bar behavior and scene URL forwarding. LineLab places its banner only on Home.
No app content, user preferences, assessment responses, location or account data
are supplied as advertising request parameters. The Google SDK can still process
network/device and diagnostic data when test ads run; test ads do not mean zero collection.
Personalization and publisher first-party IDs are disabled. No ATT request is added.

Use `--disable-test-ads` when a Debug UI regression needs a stable layout.
XCTest-hosted processes also leave ads off. Ad validation should separately run
`bash scripts/admob-smoke.sh`: it checks fresh-install and offline eligibility,
compiles the real app, launches an iPhone
simulator, requires the Google load callback, and saves logs plus a screenshot.
Physical TestFlight testing remains necessary for receipt detection, layout,
keyboard, scanning/sharing, background/foreground, ad taps and offline behavior.

This changes beta advertising only. Live monetization needs app-specific IDs,
consent/privacy messaging, accurate store disclosures and its own release validation.
Existing App Store submissions and selected public-release builds are not changed.

References:
- https://developers.google.com/admob/ios/test-ads
- https://developers.google.com/admob/ios/quick-start
- https://developers.google.com/admob/ios/privacy/data-disclosure
- https://developer.apple.com/documentation/storekit/apptransaction/shared
- https://developer.apple.com/documentation/foundation/bundle/appstorereceipturl
