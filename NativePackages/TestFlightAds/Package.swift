// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TestFlightAds",
    platforms: [.iOS(.v15)],
    products: [.library(name: "TestFlightAds", targets: ["TestFlightAds"])],
    dependencies: [
        .package(url: "https://github.com/googleads/swift-package-manager-google-mobile-ads.git", exact: "13.9.0")
    ],
    targets: [
        .target(name: "TestFlightAds", dependencies: [
            .product(name: "GoogleMobileAds", package: "swift-package-manager-google-mobile-ads")
        ])
    ]
)
