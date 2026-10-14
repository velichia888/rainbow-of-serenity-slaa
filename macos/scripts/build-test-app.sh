#!/usr/bin/env bash
# Rainbow macOS development build. Ad-hoc signature, not notarized or Mac App Store-ready.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
OUT="$ROOT/build/macos"
APP="$OUT/Rainbow of Serenity.app"
CONTENTS="$APP/Contents"
RES="$CONTENTS/Resources"
SOURCE="$ROOT/ios-app/www/assets/apple-touch-icon.png"
ICONSET="$OUT/Rainbow.iconset"
SDK="$(xcrun --sdk macosx --show-sdk-path)"

test -f ios-app/www/index.html
test -f ios-app/www/meeting.ics
test -d ios-app/www/docs
test -d ios-app/www/assets
test -f "$SOURCE"
grep -q 'id="panel-counter"' ios-app/www/index.html
grep -q 'ros_recovery_plan_v1' ios-app/www/index.html
if grep -q 'class="top-nav"' ios-app/www/index.html; then
  echo "Refusing to package the public website homepage." >&2
  exit 1
fi

mkdir -p "$OUT"
rm -rf "$APP" "$ICONSET"
mkdir -p "$CONTENTS/MacOS" "$RES/Web" "$ICONSET"
cp -R ios-app/www/. "$RES/Web/"

cat > "$CONTENTS/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDevelopmentRegion</key><string>en</string>
<key>CFBundleExecutable</key><string>RainbowOfSerenity</string>
<key>CFBundleIdentifier</key><string>com.rainbowofserenity.companion</string>
<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
<key>CFBundleName</key><string>Rainbow of Serenity</string>
<key>CFBundleDisplayName</key><string>Rainbow of Serenity</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleIconFile</key><string>Rainbow.icns</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSHighResolutionCapable</key><true/>
<key>NSPrincipalClass</key><string>NSApplication</string>
</dict></plist>
PLIST

for size in 16 32 128 256 512; do
  twice=$((size * 2))
  sips -z "$size" "$size" "$SOURCE" --out "$ICONSET/icon_"$size"x"$size".png" >/dev/null
  sips -z "$twice" "$twice" "$SOURCE" --out "$ICONSET/icon_"$size"x"$size"@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$RES/Rainbow.icns"

SWIFT="$ROOT/macos/Sources/RainbowMacApp.swift"
xcrun swiftc -target arm64-apple-macos13.0 -sdk "$SDK" -O -framework SwiftUI -framework WebKit -framework AppKit "$SWIFT" -o "$OUT/ros-arm64"
xcrun swiftc -target x86_64-apple-macos13.0 -sdk "$SDK" -O -framework SwiftUI -framework WebKit -framework AppKit "$SWIFT" -o "$OUT/ros-x86_64"
lipo -create "$OUT/ros-arm64" "$OUT/ros-x86_64" -output "$CONTENTS/MacOS/RainbowOfSerenity"
chmod +x "$CONTENTS/MacOS/RainbowOfSerenity"
codesign --force --sign - --timestamp=none "$APP"
codesign --verify --verbose "$APP"
test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$CONTENTS/Info.plist")" = "com.rainbowofserenity.companion"
lipo -verify_arch arm64 x86_64 "$CONTENTS/MacOS/RainbowOfSerenity"
ditto -c -k --keepParent --sequesterRsrc "$APP" "$OUT/RainbowOfSerenity-macOS-test.zip"
test -s "$OUT/RainbowOfSerenity-macOS-test.zip"
echo "Mac test app: $APP"
echo "Mac test ZIP: $OUT/RainbowOfSerenity-macOS-test.zip"
