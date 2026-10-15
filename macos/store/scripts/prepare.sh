#!/usr/bin/env bash
# Prepare independent macOS Xcode target for Mac App Store compilation.
# The iOS source tree and working macOS test workflow are never changed.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
STORE="$ROOT/macos/store"
RES="$STORE/Resources"
ICONSET="$RES/Assets.xcassets/AppIcon.appiconset"
SOURCE="$ROOT/ios-app/www/assets/apple-touch-icon.png"
test -f "$SOURCE"
test -d "$ROOT/ios-app/www/assets"
test -d "$ROOT/ios-app/www/docs"
test -f "$ROOT/ios-app/www/meeting.ics"
test -f "$ROOT/ios-app/www/index.html"
grep -Fq 'id="panel-counter"' "$ROOT/ios-app/www/index.html"
grep -Fq 'ros_recovery_plan_v1' "$ROOT/ios-app/www/index.html"
if grep -Fq 'class="top-nav"' "$ROOT/ios-app/www/index.html"; then
  echo "Refusing to package Rainbow's public website in a native app." >&2
  exit 1
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "XcodeGen is required; no xcodegen or Homebrew found." >&2
    exit 1
  fi
  brew install xcodegen
fi

mkdir -p "$RES/Web" "$ICONSET"
cp -R "$ROOT/ios-app/www/." "$RES/Web/"
for size in 16 32 128 256 512; do
  twice=$((size * 2))
  sips -z "$size" "$size" "$SOURCE" --out "$ICONSET/icon_"$size"x"$size".png" >/dev/null
  sips -z "$twice" "$twice" "$SOURCE" --out "$ICONSET/icon_"$size"x"$size"@2x.png" >/dev/null
done
cat > "$ICONSET/Contents.json" <<'JSON'
{
  "images": [
    {"idiom":"mac","size":"16x16","scale":"1x","filename":"icon_16x16.png"},
    {"idiom":"mac","size":"16x16","scale":"2x","filename":"icon_16x16@2x.png"},
    {"idiom":"mac","size":"32x32","scale":"1x","filename":"icon_32x32.png"},
    {"idiom":"mac","size":"32x32","scale":"2x","filename":"icon_32x32@2x.png"},
    {"idiom":"mac","size":"128x128","scale":"1x","filename":"icon_128x128.png"},
    {"idiom":"mac","size":"128x128","scale":"2x","filename":"icon_128x128@2x.png"},
    {"idiom":"mac","size":"256x256","scale":"1x","filename":"icon_256x256.png"},
    {"idiom":"mac","size":"256x256","scale":"2x","filename":"icon_256x256@2x.png"},
    {"idiom":"mac","size":"512x512","scale":"1x","filename":"icon_512x512.png"},
    {"idiom":"mac","size":"512x512","scale":"2x","filename":"icon_512x512@2x.png"}
  ],
  "info": {"version": 1, "author":"xcode"}
}
JSON
cd "$STORE"
xcodegen generate --spec project.yml
test -d RainbowOfSerenityMac.xcodeproj
xcodebuild -list -project RainbowOfSerenityMac.xcodeproj
echo "Independent Xcode macOS target prepared from Rainbow's companion assets."
