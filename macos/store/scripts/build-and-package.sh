#!/usr/bin/env bash
# Archive Mac App Store version and produce an installer-signed .pkg.
# Requires Codemagic keychain, Mac distribution cert/profile and installer cert.
# NO App Store Connect upload, NOT a public Mac distribution.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
STORE="$ROOT/macos/store"
OUT="$ROOT/build/macos-store"
ARCHIVE="$OUT/RainbowOfSerenity.xcarchive"
APP="$ARCHIVE/Products/Applications/Rainbow of Serenity.app"
PKG="$OUT/RainbowOfSerenity-macOS-AppStore-candidate.pkg"
test -d "$STORE/RainbowOfSerenityMac.xcodeproj"
mkdir -p "$OUT"

xcodebuild archive \
  -project "$STORE/RainbowOfSerenityMac.xcodeproj" \
  -scheme RainbowOfSerenityMac \
  -configuration Release \
  -destination 'generic/platform=macOS' \
  -archivePath "$ARCHIVE" \
  ONLY_ACTIVE_ARCH=NO \
  ARCHS="arm64 x86_64"

test -d "$APP"
test -f "$APP/Contents/embedded.provisionprofile"
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Contents/Info.plist")" = "com.rainbowofserenity.companion"
codesign --verify --strict --verbose=2 "$APP"
lipo "$APP/Contents/MacOS/Rainbow of Serenity" -verify_arch arm64 x86_64

ENTITLEMENTS="$OUT/signed-entitlements.plist"
codesign -d --entitlements :- "$APP" > "$ENTITLEMENTS" 2>/dev/null
plutil -lint "$ENTITLEMENTS"
test "$(/usr/libexec/PlistBuddy -c 'Print :com.apple.security.app-sandbox' "$ENTITLEMENTS")" = "true"
test "$(/usr/libexec/PlistBuddy -c 'Print :com.apple.security.network.client' "$ENTITLEMENTS")" = "true"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to inspect Codemagic signing certificates." >&2
  exit 1
fi
INSTALLER_NAME="$(keychain list-certificates | jq -r '.[] | select(.common_name | test("Mac Installer Distribution|3rd Party Mac Developer Installer")) | .common_name' | head -n 1)"
if [ -z "$INSTALLER_NAME" ]; then
  echo "Mac Installer Distribution certificate missing from Codemagic keychain." >&2
  exit 1
fi

xcrun productbuild --component "$APP" /Applications "$OUT/Rainbow-unsigned.pkg"
xcrun productsign --sign "$INSTALLER_NAME" "$OUT/Rainbow-unsigned.pkg" "$PKG"
test -s "$PKG"
pkgutil --check-signature "$PKG"
rm -f "$OUT/Rainbow-unsigned.pkg"

echo "Signed Mac App Store candidate (not uploaded): $PKG"
