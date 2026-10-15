# Rainbow of Serenity macOS App Store candidate

Branch: `feat/ros-macos-appstore-candidate-20261014`
Based on tested macOS prototype branch `feat/ros-macos-v1-desktop-20261014`.
The existing iOS App Store review, iOS source and Mac test workflow remain unchanged.

## Preparation
1. In App Store Connect > Rainbow of Serenity > Add Platform > macOS.
2. Reuse Apple ID `6816620890` and bundle ID `com.rainbowofserenity.companion`. Apple uses the same app record.
3. Verify Codemagic App Store Connect integration `rainbow_companion_asc` has App Manager permissions.
4. In Codemagic `app_store_credentials`, configure encrypted `CERTIFICATE_PRIVATE_KEY` appropriate for creating Mac App Distribution and Mac Installer Distribution certificates. Never commit this private key or paste it into chat. Existing iOS signing certificates are NOT Mac distribution certificates.
5. Confirm the Apple Developer account can create Mac App Store signing certificates and a Mac App Store provisioning profile. Avoid revoking any existing certificates automatically; Apple applies certificate-count limits.

## Manual workflow — not submitted, not uploaded
Branch: `feat/ros-macos-appstore-candidate-20261014`
Workflow: **Rainbow of Serenity - signed Mac App Store candidate**
Artifact (when it succeeds): `build/macos-store/RainbowOfSerenity-macOS-AppStore-candidate.pkg`

- Generates an independent native macOS Xcode target with XcodeGen.
- Packages Rainbow's existing recovery companion resources, correctly assigns native icon.
- Adds required macOS App Sandbox and outgoing network entitlements.
- Fetches Mac Store distribution certificate/profile and Mac Installer certificate using Codemagic.
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
