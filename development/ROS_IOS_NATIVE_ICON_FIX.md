# Native iOS home-screen icon correction

Isolated fix branch: `fix/ros-ios-native-icon-20261014`, based on `feat/ros-1.1-recovery-home` at `fdf898f35c09a2beea41d860702dfb63abfac0f2`.

## Root cause
The unsigned IPA's native iPhone home-screen icon was confirmed to be the stock blue Capacitor logo (`Payload/App.app/AppIcon60x60@2x.png`). The correct Rainbow of Serenity pastel rainbow, landscape and triangle logo was included only in the web bundle as `apple-touch-icon.png`; Capacitor does not map this automatically to Xcode's native asset catalog.

## Fix
All three Codemagic iOS workflows call `scripts/prepare-ios-icon.sh` after `npx cap add ios` and before native `xcodebuild`. The script checks for the generated `Assets.xcassets/AppIcon.appiconset` and its `Contents.json`, then uses macOS `sips` to put the Rainbow logo at `AppIcon-512@2x.png` (1024 × 1024, RGB). Fail closed if the generated project layout changes.

This first correction enlarges an existing 180 px icon; a future design pass may replace it with native 1024 px source artwork for sharper App Store marketing imagery.

## Integration boundary
The signed App Store Connect candidate had already been queued when the icon issue was raised. This fix is intentionally committed on a separate branch. It does NOT affect the queued build. Once that build completes, verify its icon; then integrate this fix onto the tested 1.1 branch, requalify, and start a new signed candidate for App Store Connect. Do not submit the old-icon candidate for App Review.

## Acceptance
- New build's native app icon, not just web `apple-touch-icon`, matches Rainbow.
- Inspect `Payload/App.app/AppIcon60x60@2x.png` in the new IPA.
- Test on iPhone after install. iOS may cache older icons until a restart or app reinstall; avoid deleting apps with sensitive local data before preserving it.
- Compare bundle ID and build numbers, confirm App Store Connect processed correctly.
