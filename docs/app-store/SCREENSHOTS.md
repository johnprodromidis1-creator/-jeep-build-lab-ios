# App Store screenshots plan

Checked September 13, 2026 against Apple App Store Connect Help.

## Required capture targets

Apple currently accepts one to 10 screenshots per device size in `.jpeg`, `.jpg` or `.png`, and screenshots cannot include alpha/transparency. Because the Xcode project currently declares `TARGETED_DEVICE_FAMILY = "1,2"`, plan for both iPhone and iPad screenshots unless the product decision is changed to iPhone-only and the native target is reverified.

| Target | Use this device/path | Accepted portrait sizes |
| --- | --- | --- |
| iPhone 6.9-inch | 6.9-inch iPhone simulator/device family, or the owner's iPhone 17 Pro Max TestFlight install | `1260 x 2736`, `1290 x 2796`, or `1320 x 2868` |
| iPad 13-inch | iPad simulator or physical iPad running the signed/TestFlight app | `2064 x 2752` or `2048 x 2732` |

Apple says highest-resolution screenshots can scale down for smaller sizes when the UI is the same across device sizes and localizations. Use raw screenshots from the actual signed or TestFlight app first; do not submit browser captures or generated mockups as final App Store screenshots.

Sources:
- <https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications>
- <https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/>

## Capture sequence

Use English metadata and fresh demo data. Keep the coverage honest: 2018-2023 JL Unlimited 3.6L gas plus first-batch 2024 Sahara 4xe support only.

1. Builder overview: clean install, tap **Load starter**, show the 2024 Sahara 4xe starter with preview, 33-inch tires, 2-inch lift and budget total visible.
2. Catalog fitment: open **Show excluded** on Tires or Wheels so compatible options and excluded reasons are visible.
3. Plan and price: show buy now/buy later stages, matching spare quantity and allowance fields.
4. Garage: save the starter as a named build, create one second lightweight variation, then show **My garage** with saved estimates.
5. Compare: open side-by-side comparison with differing parts enabled.
6. Settings/help: show backup/privacy/support controls only if a sixth screenshot is useful after the core builder story is clear.

## Capture hygiene

- Capture from the native app, not the public website.
- Do not include real personal build notes, email inboxes, passwords, Apple IDs, notification banners or browser chrome.
- Avoid overlay copy until trademark and metadata wording are final; raw app UI is safer for the first submission.
- Do not show unsupported vehicles, live-price claims, checkout language, affiliate claims or installer-certified fitment claims.
- Re-run the TestFlight smoke tests after screenshots if data was restored or erased during capture.
