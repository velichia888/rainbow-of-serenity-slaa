'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const web = fs.readFileSync('app/index.html','utf8');
const ios = fs.readFileSync('ios-app/www/index.html','utf8');
const pipeline = fs.readFileSync('codemagic.yaml','utf8');

test('daily home connects to the existing check-in and recovery features', () => {
  for (const html of [web, ios]) {
    for (const id of ['panel-counter', 'panel-checkin', 'panel-meditate', 'panel-meeting',
                       'ros-today-status', 'ros-plan-form', 'ros-plan-signs',
                       'ros-plan-actions', 'ros-plan-support']) {
      assert.ok(html.includes('id="' + id + '"'), 'missing ' + id);
    }
    assert.match(html, /data-ros-go="panel-checkin"/);
    assert.match(html, /data-ros-go="panel-meeting"/);
    assert.match(html, /ros_recovery_plan_v1/);
    for (const legacy of ['ros_checkins', 'ros_clean_date', 'ros_gratitude']) {
      assert.ok(html.includes(legacy), 'legacy key missing: ' + legacy);
    }
  }
});

test('new inline home JavaScript parses in both website and native entry', () => {
  for (const html of [web, ios]) {
    const match = html.match(/<script>\s*(\/\* Rainbow 1\.1 daily home\.[\s\S]*?)<\/script>/);
    assert.ok(match, 'home logic not found');
    assert.doesNotThrow(() => new vm.Script(match[1]));
  }
});

test('native iOS companion is the launch page, not the public meeting website', () => {
  assert.match(ios, /<title>Rainbow Companion<\/title>/);
  assert.match(pipeline, /cp -R ios-app\/www\/\. www\//);
  assert.doesNotMatch(pipeline, /cp -R app assets \*\.html/);
  assert.match(pipeline, /grep -q 'id="panel-counter"' www\/index\.html/);
  assert.match(pipeline, /Refusing to package the public meeting website/);
});

test('unsigned device workflow has no publishing, signing integration, or auto-trigger', () => {
  const unsigned = (pipeline.split('  ios-device-unsigned:')[1] || '').split(/\n  (?=[a-z][a-z0-9-]*:)/)[0];
  assert.ok(unsigned, 'missing unsigned device workflow');
  assert.match(unsigned, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(unsigned, /RainbowOfSerenity-1\.1-unsigned\.ipa/);
  assert.match(unsigned, /cp -R ios-app\/www\/\. www\//);
  for (const dangerous of [/publishing:/, /integrations:/, /ios_signing:/, /submit_to_testflight:/, /triggering:/]) {
    assert.doesNotMatch(unsigned, dangerous);
  }
});
test('release workflow refuses a development branch before any signing', () => {
  const signed = pipeline.split('  ios-device-unsigned:')[0];
  const guard = signed.indexOf('Guard published release branch');
  const npm = signed.indexOf('- name: Install npm dependencies');
  assert.ok(guard > 0 && npm > guard);
  assert.match(signed, /CM_BRANCH:-/);
  assert.match(signed, /main/);
});
