# Rainbow of Serenity — macOS desktop prototype

Branch: `feat/ros-macos-v1-desktop-20261014`
Based on the verified iOS 1.1 feature branch at commit `40ea46d2b744e79ec61e481893df139893b25027`.
The iOS submission and `main` are unchanged.

## What is included
- Native SwiftUI macOS application window (macOS 13 or later), default 1080x740 with resizable split view
- Sidebar for My Recovery, Daily Check-In, Affirmations, Readings, Meetings, Community
- Native Recovery menu and Cmd+1..6 shortcuts
- Native Quick Exit menu shortcut Cmd+Shift+X; also a native toolbar action
- Native macOS confirmation/alert handling for recovery-plan deletion
- App icon from Rainbow's own app artwork
- Persistent WKWebView data store for private entries on **this Mac only**; no sync with iPhone
- Responsive desktop styling, external links opened through default Mac browser/mail/Calendar
- Bundled recovery source `ios-app/www/`, independent of the public marketing homepage
- Debug/development .app ZIP for Apple silicon and Intel architecture

## Codemagic development build
Open Rainbow of Serenity project in Codemagic > Start new build.
Select branch `feat/ros-macos-v1-desktop-20261014`.
Select workflow **Rainbow of Serenity - macOS desktop test**.
Expected artifact: `build/macos/RainbowOfSerenity-macOS-test.zip`.

This is a manual, ad-hoc-signed development build, not notarized or Mac App Store signed. We have NOT yet run Codemagic or a physical Mac acceptance test. macOS Gatekeeper may block ad-hoc apps downloaded from the web. Do not bypass security controls on a shared machine or redistribute unsigned testing builds.

## Acceptance checklist — only fictional recovery data
1. Confirm first screen is "Your recovery, your pace", not the public website.
2. Resize window; verify native sidebar, menus, and Cmd+1 through Cmd+6.
3. Save mock recovery date, daily check-in, gratitude entry, and recovery plan.
4. Quit/reopen. Verify all entries persist locally. Note any WebKit local-file storage errors.
5. Delete mock recovery plan; verify native confirmation appears and deletion persists.
6. Turn off Wi-Fi; test private tools and readings. Community is expected to need connectivity.
7. Test dark mode, text-size preference, Mac keyboard, VoiceOver, and external Zoom/Calendar links.
8. Test Quick Exit behavior and return to the app via Dock.
9. Confirm app has Rainbow's icon. Never uninstall an app containing real private recovery records without a verified backup.

## Review boundaries
- This is a prototype. macOS storage persistence and local WebKit-origin behavior need real-device acceptance.
- The community feed still needs reporting/blocking/content filtering and review moderation before an App Store review.
- Recovery data is locally stored in WebKit, not encrypted by this feature. Do not claim iPhone/macOS data sync or backups.
- Mac App Store submission will require an Xcode macOS target/archive, App Sandbox and network entitlements, proper Mac App Store signing, testing, screenshots, review notes, and the platform entry in App Store Connect.
- Apple's App Store Connect can add macOS to the existing iOS app record using the same bundle ID `com.rainbowofserenity.companion`, sharing numeric Apple ID `6816620890`.
- This branch does not modify signing credentials, auto-upload to App Store Connect, trigger beta App Review, or alter the existing iOS workflows.
