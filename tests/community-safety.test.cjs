'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('ios-app/www/index.html', 'utf8');
const website = fs.readFileSync('app/index.html', 'utf8');
const iosModule = fs.readFileSync('ios-app/www/assets/community.js', 'utf8');
const webModule = fs.readFileSync('app/assets/community.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const privacy = fs.readFileSync('ios-app/www/privacy.html', 'utf8');
const publicPrivacy = fs.readFileSync('privacy.html', 'utf8');

test('community safety module ships in both builds without duplicate inline legacy logic', () => {
  assert.equal(iosModule, webModule);
  assert.doesNotThrow(() => new vm.Script(iosModule));
  for (const html of [app, website]) {
    assert.match(html, /src="\.\/assets\/community\.js"/);
    assert.doesNotMatch(html, /var firebaseConfig =/);
    for (const key of ['feed-hidden-status', 'feed-restore-hidden',
                       'feed-guidelines', 'feed-reports', 'feed-report-list']) {
      assert.match(html, new RegExp('id="' + key + '"'));
    }
  }
});

test('member controls safely render text, report abuse, and persist local hidden accounts', () => {
  for (const phrase of [
    "paragraph(post.text || '', 'feed-text')",
    "localStorage.setItem(BLOCK_KEY",
    "hiddenUids.includes(post.uid)",
    "Send report",
    "fs.setDoc(fs.doc(reports, id)",
    "reporterUid: user.uid",
    "postId: post.id",
    "fs.updateDoc(fs.doc(reports, item.id)",
    "fs.deleteDoc(fs.doc(feed, report.postId))"
  ]) {
    assert.ok(iosModule.includes(phrase), 'Missing safety implementation: ' + phrase);
  }
  assert.doesNotMatch(iosModule, /row\.innerHTML\s*=\s*post\.text|insertAdjacentHTML\([^,]+,\s*post\.text/);
});

test('reports have restrictive document IDs, private read, and mod-only review', () => {
  const report = rules.split('match /reports/{reportId} {')[1].split('match /{document=**}')[0];
  assert.ok(report);
  for (const rule of [
    "reportId == request.auth.uid + '_' + request.resource.data.postId",
    "request.resource.data.reporterUid == request.auth.uid",
    "request.resource.data.status == 'open'",
    "request.resource.data.createdAt == request.time",
    "allow read: if isModerator();",
    "allow update: if isModerator()",
    "allow delete: if isModerator();",
    "request.resource.data.diff(resource.data).affectedKeys().hasOnly"
  ]) {
    assert.ok(report.includes(rule), 'Missing report authorization: ' + rule);
  }
  assert.doesNotMatch(report, /allow read: if true|allow write: if true/);
});

test('safety and recovery information are accurately disclosed in bundled privacy notice', () => {
  assert.equal(privacy, publicPrivacy);
  for (const word of [
    'Firebase', 'anonymous', 'report', 'locally', 'moderators',
    'No advertising', 'not encrypted', 'not an official product'
  ]) {
    assert.match(privacy.toLowerCase(), new RegExp(word.toLowerCase()));
  }
  assert.doesNotMatch(privacy, /<h2>Photo gallery<\/h2>|<h2>12-step journal<\/h2>/);
  assert.match(app, /href="\.\/privacy\.html"/);
  assert.match(website, /href="\.\.\/privacy\.html"/);
});

test('community safety changes leave local recovery key compatibility intact', () => {
  for (const key of ['ros_recovery_plan_v1', 'ros_clean_date', 'ros_checkins', 'ros_gratitude']) {
    assert.ok(app.includes(key), 'Recovery key missing: ' + key);
  }
});

test('new Community posts remain private until a moderator approves them', () => {
  const publicFeedRule = rules.split('match /feed/{postId} {')[1].split('match /pendingFeed/{pendingId}')[0];
  const pendingRule = rules.split('match /pendingFeed/{pendingId} {')[1].split('match /rate/{uid}')[0];
  assert.match(publicFeedRule, /allow create: if isModerator\(\)/);
  assert.doesNotMatch(publicFeedRule, /allow create: if request\.auth != null/);
  assert.match(pendingRule, /allow create: if request\.auth != null/);
  assert.match(pendingRule, /allow read, delete: if isModerator\(\);/);
  assert.match(iosModule, /batch\.set\(fs\.doc\(pendingFeed\)/);
  assert.match(iosModule, /status\('Sent for moderator review/);
  assert.match(iosModule, /batch\.delete\(fs\.doc\(pendingFeed, item\.id\)\)/);
  assert.match(iosModule, /Approve and publish/);
  for(const html of [app, website]){
    assert.match(html, /id="feed-pending"/);
    assert.match(html, /id="feed-pending-list"/);
  }
});
