@main
struct AdEligibilityChecks {
    enum Offline: Error { case unavailable }
    static func main() async {
        var lookupCount = 0
        let sandboxReceipt = await AdEligibility.resolve(receiptName: "sandboxReceipt") {
            lookupCount += 1
            return false
        }
        precondition(sandboxReceipt == true && lookupCount == 0, "Sandbox receipt enables test ads without a network lookup")
        let productionReceipt = await AdEligibility.resolve(receiptName: "receipt") {
            lookupCount += 1
            return true
        }
        precondition(productionReceipt == false && lookupCount == 0, "Production receipt cannot enable ads")
        let newBetaInstall = await AdEligibility.resolve(receiptName: nil) { true }
        precondition(newBetaInstall == true, "A fresh sandbox install without a receipt must enable test ads")
        let productionInstall = await AdEligibility.resolve(receiptName: nil) { false }
        precondition(productionInstall == false, "A signed production install without a receipt must not enable ads")
        let unavailable = await AdEligibility.resolve(receiptName: nil) { throw Offline.unavailable }
        precondition(unavailable == nil, "Offline/authentication errors must permit a later retry")
        let retry = await AdEligibility.resolve(receiptName: nil) { true }
        precondition(retry == true, "A later verified sandbox lookup must recover from an unavailable lookup")
        let unknownReceipt = await AdEligibility.resolve(receiptName: "unknownReceipt") { false }
        precondition(unknownReceipt == false, "An unknown receipt name must not enable ads without signed sandbox information")
        print("PASS: 7 beta-ad eligibility checks, including fresh installs and offline recovery")
    }
}
