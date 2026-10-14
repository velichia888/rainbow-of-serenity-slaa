'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const yaml = fs.readFileSync('codemagic.yaml', 'utf8');
const source = fs.readFileSync('macos/Sources/RainbowMacApp.swift', 'utf8');
const build = fs.readFileSync('macos/scripts/build-test-app.sh', 'utf8');

test('macOS Codemagic workflow is manual and cannot publish to App Store', () => {
  const mac = yaml.split('  macos-desktop-test:')[1] || '';
  assert.match(mac, /name: Rainbow of Serenity - macOS desktop test/);
  assert.match(mac, /feat\/ros-macos-v1-desktop-20261014/);
  assert.match(mac, /bash macos\/scripts\/build-test-app.sh/);
  assert.doesNotMatch(mac, /\btriggering:|\bpublishing:|app_store_connect:|ios_signing:/);
});

test('macOS native shell includes desktop navigation and data persistence', () => {
  assert.match(source, /NavigationSplitView/);
  assert.match(source, /CommandMenu\("Recovery"\)/);
  assert.match(source, /keyboardShortcut/);
  assert.match(source, /WKWebView/);
  assert.match(source, /websiteDataStore = \.default\(\)/);
  assert.match(source, /runJavaScriptConfirmPanelWithMessage/);
  assert.match(source, /func quickExit\(\)/);
});

test('direct swiftc compilation supports SwiftUI @main for both architectures', () => {
  assert.match(source, /@main\s+private struct RainbowOfSerenityMac: App/);
  for (const arch of ['arm64', 'x86_64']) {
    assert.match(build, new RegExp('xcrun swiftc -parse-as-library -target ' + arch + '-apple-macos13\\.0'));
  }
  assert.doesNotMatch(build, /xcrun swiftc -target /);
});

test('lipo verifies both architectures using input-first command syntax', () => {
  assert.match(build, /lipo "\\$CONTENTS\\/MacOS\\/RainbowOfSerenity" -verify_arch arm64 x86_64/);
  assert.doesNotMatch(build, /lipo -verify_arch arm64 x86_64/);
});

test('Mac test bundle contains correct companion and universal architecture', () => {
  assert.match(build, /arm64-apple-macos13\.0/);
  assert.match(build, /x86_64-apple-macos13\.0/);
  assert.match(build, /lipo -create/);
  assert.match(build, /ios-app\/www\/index.html/);
  assert.match(build, /ros_recovery_plan_v1/);
  assert.match(build, /com\.rainbowofserenity\.companion/);
  assert.match(build, /iconutil -c icns/);
  assert.match(build, /RainbowOfSerenity-macOS-test\.zip/);
  assert.doesNotMatch(build, /notarytool|app-store-connect|submit_to_app_store/);
});
