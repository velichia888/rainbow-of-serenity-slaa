#!/usr/bin/env bash
# Rainbow of Serenity iOS icon.
# In Capacitor, the website's apple-touch-icon does NOT become the native app icon.
# Override the generated default Capacitor AppIcon before xcodebuild.
source_icon="ios-app/www/assets/apple-touch-icon.png"
icon_set="ios/App/App/Assets.xcassets/AppIcon.appiconset"
icon_json="$icon_set/Contents.json"
icon_target="$icon_set/AppIcon-512@2x.png"

if [ ! -f "$source_icon" ]; then
  echo "Rainbow web icon not found: $source_icon" >&2
  exit 1
fi
if [ ! -d "$icon_set" ] || [ ! -f "$icon_json" ]; then
  echo "Capacitor iOS AppIcon asset catalog not found: $icon_set" >&2
  exit 1
fi
if ! grep -Fq 'AppIcon-512@2x.png' "$icon_json"; then
  echo "Xcode AppIcon catalog changed and no longer refers to AppIcon-512@2x.png." >&2
  exit 1
fi
if ! command -v sips >/dev/null 2>&1; then
  echo "This step requires macOS sips." >&2
  exit 1
fi

# Source is Rainbow's opaque 180x180 artwork (pastel rainbow, green hills,
# SLAA triangle). Resize to the 1024x1024 Xcode asset canvas.
# A later art pass can replace this with high-res artwork without changing
# the build logic.
if ! sips -z 1024 1024 "$source_icon" --out "$icon_target" >/dev/null; then
  echo "Failed to rasterize Rainbow's native iOS app icon." >&2
  exit 1
fi
if ! sips -g pixelWidth -g pixelHeight "$icon_target" | grep -q 'pixelWidth: 1024'; then
  echo "Native app icon is not 1024 pixels wide." >&2
  exit 1
fi
if ! sips -g pixelWidth -g pixelHeight "$icon_target" | grep -q 'pixelHeight: 1024'; then
  echo "Native app icon is not 1024 pixels tall." >&2
  exit 1
fi
echo "Rainbow of Serenity native iOS icon installed: $icon_target"
