'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const yaml = fs.readFileSync('codemagic.yaml','utf8');
const project = fs.readFileSync('macos/store/project.yml','utf8');
const prepare = fs.readFileSync('macos/store/scripts/prepare.sh','utf8');
const build = fs.readFileSync('macos/store/scripts/build-and-package.sh','utf8');

test('macOS Xcode preflight compiles without credentials or Apple upload',()=>{
  const p = yaml.split('  macos-store-preflight:')[1].split('  macos-store-candidate:')[0];
  assert.match(p,/Rainbow of Serenity - macOS Xcode preflight/);
  assert.match(p,/CODE_SIGNING_ALLOWED=NO/);
  assert.match(p,/RainbowOfSerenity-MacXcode-preflight\.zip/);
  assert.match(p,/xcodebuild build/);
  assert.doesNotMatch(p,/\n    publishing:|\n    triggering:|fetch-signing-files|keychain add-certificates/);
});

test('Mac Store candidate cannot auto publish and is protected by branch guard',()=>{
  const c = yaml.split('  macos-store-candidate:')[1] || '';
  assert.match(c,/name: Rainbow of Serenity - signed Mac App Store candidate/);
  assert.match(c,/feat\/ros-macos-appstore-candidate-20261014/);
  assert.match(c,/CERTIFICATE_PRIVATE_KEY/);
  assert.doesNotMatch(c,/\btriggering:|\bpublishing:|submit_to_app_store:|submit_to_testflight:/);
  assert.match(c,/fetch-signing-files "\$BUNDLE_ID" --platform MAC_OS --type MAC_APP_STORE --strict-match-identifier/);
  assert.doesNotMatch(c,/\s--create\b|certificates create|certificates delete|profiles delete/);
  assert.match(c,/No reusable Mac App Store signing pair/);
  assert.match(c,/MAC_INSTALLER_DISTRIBUTION/);
  assert.match(c,/keychain add-certificates/);
  assert.match(c,/xcode-project use-profiles/);
});

test('Mac app has a genuine independent Xcode target and required sandbox',()=>{
  assert.match(project,/RainbowOfSerenityMac:/);
  assert.match(project,/platform: macOS/);
  assert.match(project,/type: application/);
  assert.match(project,/PRODUCT_BUNDLE_IDENTIFIER: com\.rainbowofserenity\.companion/);
  assert.match(project,/com\.apple\.security\.app-sandbox: true/);
  assert.match(project,/com\.apple\.security\.network\.client: true/);
  assert.match(project,/Resources\/Web/);
  assert.match(project,/Assets\.xcassets/);
  assert.match(project,/MARKETING_VERSION: "1\.0"/);
});

test('Xcode project uses correct Rainbow companion assets and native icon',()=>{
  assert.match(prepare,/ios-app\/www\/index\.html/);
  assert.match(prepare,/ros_recovery_plan_v1/);
  assert.match(prepare,/ios-app\/www\/assets\/apple-touch-icon\.png/);
  assert.match(prepare,/xcodegen generate/);
  assert.match(prepare,/AppIcon\.appiconset/);
});

test('App Store candidate verifies signed archive, entitlements, architectures and signed pkg',()=>{
  assert.match(build,/xcodebuild archive/);
  assert.match(build,/codesign --verify --strict/);
  assert.match(build,/lipo "\$APP\/Contents\/MacOS\/Rainbow of Serenity" -verify_arch arm64 x86_64/);
  assert.match(build,/embedded\.provisionprofile/);
  assert.match(build,/com\.apple\.security\.app-sandbox/);
  assert.match(build,/com\.apple\.security\.network\.client/);
  assert.match(build,/xcrun productbuild/);
  assert.match(build,/xcrun productsign/);
  assert.match(build,/pkgutil --check-signature/);
  assert.doesNotMatch(build,/altool|notarytool|app-store-connect upload/);
});
