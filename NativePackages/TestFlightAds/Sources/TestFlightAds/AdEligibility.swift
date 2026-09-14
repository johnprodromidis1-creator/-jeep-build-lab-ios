/// A missing receipt must defer to signed StoreKit app information.
/// nil means the environment could not be checked and may be retried later.
enum AdEligibility {
    static func resolve(
        receiptName: String?,
        verifiedSandbox: () async throws -> Bool
    ) async -> Bool? {
        if receiptName == "sandboxReceipt" { return true }
        if receiptName == "receipt" { return false }
        do { return try await verifiedSandbox() }
        catch { return nil }
    }
}
