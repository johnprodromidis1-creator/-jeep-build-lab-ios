import UIKit
import SwiftUI
import GoogleMobileAds

/// Beta ads deliberately have no production ID or targeting inputs.
/// An App Store receipt (or an absent receipt in Release) never enables ads.
public enum TestFlightAds {
    public static var isEnabled: Bool {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--disable-test-ads") { return false }
        if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil { return false }
        return true
        #else
        return Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
        #endif
    }

    @MainActor public static func wrap(_ content: UIViewController) -> UIViewController {
        isEnabled ? AdContainerController(content: content) : content
    }
}

@MainActor private enum AdsStartup {
    static var task: Task<Void, Never>?

    static func start() async {
        if let task { await task.value; return }
        let startup = Task { @MainActor in
            let config = MobileAds.shared.requestConfiguration
            config.setPublisherFirstPartyIDEnabled(false)
            config.publisherPrivacyPersonalizationState = .disabled
            config.maxAdContentRating = GADMaxAdContentRating.general
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                MobileAds.shared.start { _ in continuation.resume() }
            }
        }
        task = startup
        await startup.value
    }
}

/// A single SDK-owned test banner. Failed/offline requests reserve no empty space.
@MainActor private final class BannerController: UIViewController, BannerViewDelegate {
    var sizeChanged: ((CGFloat) -> Void)?
    private var banner: BannerView?
    private var loadTask: Task<Void, Never>?
    private var loaded = false
    private var keyboardVisible = false
    private var visible = false
    private var foregroundActive = true

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .secondarySystemBackground
        view.clipsToBounds = true
        view.accessibilityIdentifier = "admob.test-banner-container"
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardDidHide), name: UIResponder.keyboardDidHideNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(resignedActive), name: UIApplication.willResignActiveNotification, object: nil)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        visible = true
        loadIfNeeded()
        updateSize()
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        visible = false
        updateSize()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateSize()
        loadIfNeeded()
    }

    private func loadIfNeeded() {
        guard TestFlightAds.isEnabled, visible, view.bounds.width >= 320,
              banner == nil, loadTask == nil, !keyboardVisible,
              UIApplication.shared.applicationState == .active else { return }
        loadTask = Task { [weak self] in
            await AdsStartup.start()
            guard !Task.isCancelled, let self else { return }
            self.loadTask = nil
            guard self.visible, !self.keyboardVisible, self.banner == nil else { return }
            let banner = BannerView(adSize: AdSizeBanner)
            // Google's dedicated, non-billable iOS fixed banner test unit.
            banner.adUnitID = "ca-app-pub-3940256099942544/2934735716"
            banner.rootViewController = self
            banner.delegate = self
            banner.translatesAutoresizingMaskIntoConstraints = false
            banner.accessibilityIdentifier = "admob.test-banner"
            self.view.addSubview(banner)
            NSLayoutConstraint.activate([
                banner.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
                banner.centerYAnchor.constraint(equalTo: self.view.centerYAnchor),
                banner.widthAnchor.constraint(equalToConstant: 320),
                banner.heightAnchor.constraint(equalToConstant: 50)
            ])
            self.banner = banner
            let request = Request()
            let extras = Extras()
            extras.additionalParameters = ["npa": "1"]
            request.register(extras)
            banner.load(request)
        }
    }

    private var lastHeight: CGFloat = -1
    private func updateSize() {
        let show = loaded && visible && !keyboardVisible && view.bounds.width >= 320
            && foregroundActive && UIApplication.shared.applicationState == .active
        banner?.isHidden = !show
        let height: CGFloat = show ? 58 : 0
        guard height != lastHeight else { return }
        lastHeight = height
        sizeChanged?(height)
    }

    func bannerViewDidReceiveAd(_ bannerView: BannerView) {
        guard bannerView === banner else { return }
        loaded = true
        updateSize()
        NSLog("ADMOB_TEST_BANNER_LOADED")
    }

    func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
        guard bannerView === banner else { return }
        loaded = false
        // Keep this failed instance until the next foreground event: no retry loop.
        updateSize()
        NSLog("ADMOB_TEST_BANNER_FAILED: %@", error.localizedDescription)
    }

    @objc private func keyboardWillShow() { keyboardVisible = true; updateSize() }
    @objc private func keyboardDidHide() { keyboardVisible = false; updateSize(); loadIfNeeded() }
    @objc private func resignedActive() { foregroundActive = false; updateSize() }
    @objc private func becameActive() {
        foregroundActive = true
        if !loaded { banner?.delegate = nil; banner?.removeFromSuperview(); banner = nil }
        updateSize()
        loadIfNeeded()
    }

    deinit {
        loadTask?.cancel()
        NotificationCenter.default.removeObserver(self)
    }
}

/// Uses child-controller containment so the web viewport ends above the ad.
@MainActor private final class AdContainerController: UIViewController {
    private let content: UIViewController
    private let ads = BannerController()
    init(content: UIViewController) { self.content = content; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("Use init(content:)") }
    override var childForStatusBarStyle: UIViewController? { content }
    override var childForStatusBarHidden: UIViewController? { content }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { content.supportedInterfaceOrientations }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { content.preferredInterfaceOrientationForPresentation }
    override var shouldAutorotate: Bool { content.shouldAutorotate }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        for child in [content, ads] {
            addChild(child)
            child.view.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(child.view)
            child.didMove(toParent: self)
        }
        let height = ads.view.heightAnchor.constraint(equalToConstant: 0)
        let contentBottom = content.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        let contentAboveAd = content.view.bottomAnchor.constraint(equalTo: ads.view.topAnchor)
        ads.sizeChanged = { [weak self] value in
            guard let self else { return }
            if value == 0 {
                contentAboveAd.isActive = false
                contentBottom.isActive = true
            } else {
                contentBottom.isActive = false
                contentAboveAd.isActive = true
            }
            height.constant = value
            self.view.setNeedsLayout()
        }
        NSLayoutConstraint.activate([
            content.view.topAnchor.constraint(equalTo: view.topAnchor),
            content.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            content.view.trailingAnchor.constraint(equalTo: view.trailingAnchor), contentBottom,
            ads.view.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            ads.view.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            ads.view.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor), height
        ])
    }
}

/// Reserve space with .safeAreaInset for SwiftUI screens, including tab navigation.
public struct TestFlightBanner: View {
    @State private var height: CGFloat = 0
    public init() {}
    public var body: some View {
        if TestFlightAds.isEnabled {
            BannerRepresentable(height: $height)
                .frame(height: height)
                .clipped()
        }
    }
}

private struct BannerRepresentable: UIViewControllerRepresentable {
    @Binding var height: CGFloat
    func makeUIViewController(context: Context) -> BannerController {
        let controller = BannerController()
        controller.sizeChanged = { value in
            // UIKit layout/delegate callbacks must not mutate SwiftUI during layout.
            DispatchQueue.main.async { height = value }
        }
        return controller
    }
    func updateUIViewController(_ controller: BannerController, context: Context) {}
    static func dismantleUIViewController(_ controller: BannerController, coordinator: ()) {
        controller.sizeChanged = nil
    }
}
