# Rainbow of Serenity macOS App Store candidate

Branch: `feat/ros-macos-appstore-candidate-20261014`
Based on tested macOS prototype branch `feat/ros-macos-v1-desktop-20261014`.
The existing iOS App Store review, iOS source and Mac test workflow remain unchanged.

## Preparation
1. In App Store Connect > Rainbow of Serenity > Add Platform > macOS.
2. Reuse Apple ID `6816620890` and bundle ID `com.rainbowofserenity.companion`. Apple uses the same app record.
3. Verify Codemagic App Store Connect integration `rainbow_companion_asc` has App Manager permissions.
4. In Codemagic `app_store_credentials`, configure encrypted `CERTIFICATE_PRIVATE_KEY` matching an **existing** Apple/Mac distribution certificate. A newly generated RSA key cannot use an older certificate unless its public key matches. Never paste the key in chat or commit it.
5. Existing `Apple Distribution` certificates may be eligible for Mac App Store signing as well as iOS; do not revoke or replace the active team certificate without investigating its use by the signed iOS build. Retrieve the correct private key from the machine that created it, or locate an existing matching .p12 backup. Mac Installer Distribution is a separate certificate with its own matching private key.
6. Ensure a Mac App Store provisioning profile exists for the exact `com.rainbowofserenity.companion` identifier. The signing workflow will **not** create or revoke certificates or profiles. If required signing files cannot be recovered, stop for a reviewed certificate rotation plan; the app can still be tested through the successful unsigned Xcode preflight.

## Manual workflow — not submitted, not uploaded
Branch: `feat/ros-macos-appstore-candidate-20261014`
Workflow: **Rainbow of Serenity - signed Mac App Store candidate**
Artifact (when it succeeds): `build/macos-store/RainbowOfSerenity-macOS-AppStore-candidate.pkg`

- Generates an independent native macOS Xcode target with XcodeGen.
- Packages Rainbow's existing recovery companion resources, correctly assigns native icon.
- Adds required macOS App Sandbox and outgoing network entitlements.
- Fetches existing Mac Store distribution certificate/profile and existing Mac Installer certificate using Codemagic (no certificate creation).
- Builds a universal (Apple silicon + Intel) signed release archive, verifies provisioning and entitlements.
- Packages an installer-signed `.pkg` with `productbuild` and `productsign`.
- **Does not upload to Apple or submit for TestFlight/App Review**. Signing configuration and archived app still need actual Xcode qualification.

## Qualifying before submission
- Inspect the signed `.pkg` and archive logs.
- Test the actual macOS app on a Mac 13 or later with fictional data, especially WebKit local-file storage persistence, external Zoom links, Quick Exit, macOS sandbox network access and live community connection.
- Confirm community reporting/blocking/moderation and App Review privacy/4.3 originality risks have been addressed. macOS review readiness is not established by a successful build.
- Later set up a separate explicitly authorized upload workflow only after successful acceptance.

## Limitations
- This workflow requires Codemagic/Apple signing credentials and an existing macOS App Store Connect platform.
- XcodeGen installed by Homebrew if unavailable. First CI run will validate compiler, signing, and package compatibility.
- Existing Mac developer test ZIP remains available and should be used for direct Mac acceptance before public submission.

## No-signing Mac Xcode preflight (run this first)
Branch: `feat/ros-macos-appstore-candidate-20261014`
Workflow: **Rainbow of Serenity - macOS Xcode preflight**
Artifact: `RainbowOfSerenity-MacXcode-preflight.zip`

This manual workflow generates the native Xcode target, compiles a universal unsigned desktop app, and checks the bundled Rainbow recovery assets and bundle ID. It does not use signing credentials, create certificates, publish to Apple, or submit for review. The ZIP is a compiler-test artifact; use the previously successful ad-hoc-signed Mac test ZIP for direct desktop acceptance.

Only move on to the signed Mac App Store candidate after this preflight passes and the macOS platform and Mac-specific signing files are configured.

## Certificate mismatch checkpoint (October 2026)
The previous signed candidate found a current/pending team distribution certificate but no certificate matching the newly generated Linux Mint `CERTIFICATE_PRIVATE_KEY`. Its automatic `--create` request produced Apple HTTP 409. That failure does **not** establish that Apple has no usable certificate, nor that the binary has failed compilation. The signed candidate is now retrieval-only with exact bundle identifier matching, and will fail safely until an existing certificate/key pair is configured. Repeating the build with the unmatched new key will not succeed. **Do not revoke certificates or delete signing profiles while iOS is under review.**
