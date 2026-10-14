'use strict';
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const yaml = fs.readFileSync('codemagic.yaml', 'utf8');
const icon = fs.readFileSync('scripts/prepare-ios-icon.sh', 'utf8');

test('every iPhone workflow replaces generated Capacitor default icon', () => {
  const names=['ios-release','ios-asc-candidate','ios-device-unsigned'];
  for (const name of names) {
    const start=yaml.indexOf('  '+name+':');
    assert.ok(start>=0,'missing '+name);
    const segment=yaml.slice(start, yaml.indexOf('\n  ',start+3)>-1 ? yaml.indexOf('\n  ',start+3):undefined);
    assert.match(segment, /bash scripts\/prepare-ios-icon.sh/);
    const iconIndex=segment.indexOf('Install Rainbow native iPhone icon');
    const buildIndex=segment.indexOf('xcode-project build-ipa')>-1 ? segment.indexOf('xcode-project build-ipa') : segment.indexOf('xcodebuild build');
    assert.ok(iconIndex>=0 && buildIndex>iconIndex,'icon must be installed before xcodebuild');
  }
});

test('icon is copied from Rainbow art into the correct native AppIcon asset catalog',()=>{
  assert.match(icon,/ios-app\/www\/assets\/apple-touch-icon.png/);
  assert.match(icon,/ios\/App\/App\/Assets.xcassets\/AppIcon.appiconset/);
  assert.match(icon,/AppIcon-512@2x.png/);
  assert.match(icon,/sips -z 1024 1024/);
  assert.match(icon,/pixelWidth: 1024/);
  assert.match(icon,/pixelHeight: 1024/);
});
