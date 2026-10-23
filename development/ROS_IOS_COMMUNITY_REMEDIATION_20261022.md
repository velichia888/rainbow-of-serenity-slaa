# Rainbow of Serenity iOS — Community and Privacy Remediation
Date: 2026-10-22
Development branch: `dev/ros-ios-community-safety-20261022`
Parent checkpoint: `audit/ros-ios-app-review-readiness-20261022`
Scope: development only. **No Firebase deployment, Codemagic job, merge, TestFlight upload, or App Review submission is authorized by this file.**

## Implementation in this branch
1. Shared community module in both `app/assets/community.js` and `ios-app/www/assets/community.js`. Both community pages load the same behavioral module. Existing private recovery features, their storage keys, and bundled iOS home remain intact.
2. New posts are submitted to private Firestore `pendingFeed` and **not shown publicly** until moderator approval. Moderator queue can approve/publish or reject a post. Approved messages go to the existing public `feed`.
3. Members can **Report post** (reason selected) on another member's approved post; reports use stable per-user/post IDs and live in private `reports` collection. Authorized moderators can delete a reported post and resolve or dismiss a report. Reports contain a Firebase UID, post ID, reason, status, timestamp; they are not public.
4. Members can **Block member** locally: posts from that anonymous Firebase UID are hidden on the current device via `ros_hidden_community_uids_v1`. An `Unblock all member accounts` action restores visibility. This is a device-local block, not a server-wide ban; anonymous identities can change.
5. Submission rejects visible links and email addresses; Firestore rules duplicate those checks, restrict fields and rate limits, and make the pending feed and reports readable only by moderators. Manual pre-publication approval is the primary objectionable-content filtering mechanism.
6. Privacy policy pages `privacy.html` (site) and `ios-app/www/privacy.html` (bundled iOS) disclose local recovery storage, Community posts, anonymous Firebase identity, reporting, local blocking, daily visitor aggregate, third-party services, deletion/contact, and no Rainbow-added encryption/sync. The unmerged gallery and step-journal PRs are deliberately not represented as shipped features.
7. Source regression test `tests/community-safety.test.cjs` added. The manual `ios-device-unsigned` Codemagic workflow now runs recovery, icon, and community tests before building.

## Integration and safety boundaries
- Do not blindly merge existing PRs #16 (journal), #17 (gallery), or #18 (outdated privacy policy). Their contents may conflict with this work. Website source `app/index.html` and native companion source `ios-app/www/index.html` are distinct; both must remain coherent.
- `main` triggers Codemagic `ios-release` on push, which publishes to TestFlight. **Never merge to main simply to publish the privacy page or web community without an explicit release plan and approval.**
- The manual Codemagic signed candidate `ios-asc-candidate` only allows `feat/ros-1.1-recovery-home` and uploads to App Store Connect even with `submit_to_app_store: false`. Do not run this workflow on the new development branch; it is not a local-only test.
- **Do not deploy `firestore.rules` independently of the updated website/community client.** New rules intentionally stop legacy public clients from posting directly to `feed`. Coordinate rollout to prevent an uncontrolled outage. The current rejected iOS 1.0 build and live website may still use the legacy direct-post contract.
- Before any backend change, verify recovery of the existing feed data, document rollback, and get approval for potential interruptions. No production database migration or deletion was performed here.
- Never use real private recovery notes when testing. Local recovery records have no app-managed backup or encryption. Do not uninstall the only copy to troubleshoot icon caching or storage.

## Required qualification before release
### Backend authorization — **not yet run**
Use Firebase Emulator Suite, not production, to validate:
- Unauthenticated user cannot create posts or reports; anonymous user can atomically create pending post plus rate record and cannot directly create public feed items.
- A normal member cannot read or delete another person's pending posts, read/list reports, approve/reject content, or claim moderator privileges.
- Rate limit and field/length/email/link restrictions reject invalid posts.
- Moderator can list pending posts and atomically publish/delete a pending entry. Approved feed must contain matching author UID/message and a legitimate server timestamp.
- Reporting another approved post succeeds exactly once per anonymous UID; duplicate, forged UID, own-post report, invalid reason, and unauthorized report read fail.
- Moderator can remove a reported post, mark a report removed/dismissed, and non-moderators cannot modify report status.
- Re-check original anonymous visitor totals, direct-feed moderator deletion, and Firebase moderation sign-in. Test network interruptions and retries.

### Source qualification — **static inspection performed only**
A JavaScript parse and parity/sanity checks were performed against GitHub files. **Node test suite, Firebase emulator, Codemagic compiler, signed IPA and device acceptance have not yet been executed.** The unsigned workflow is wired to run three source test files.

### iPhone acceptance — **not yet run on this branch**
- Home must say “Your recovery, your pace,” with existing dates/chips/check-ins/gratitude intact.
- Recovery plan save, reopen and delete; offline home/readings; large text, VoiceOver, contrast, and navigation.
- Community: submit and see a pending approval confirmation, no public visibility until a moderator approves; approved public post appears correctly.
- Another member's post: report reason -> private queue; moderator can resolve; block hides this anonymous UID locally and unblock restores it; no XSS when a post contains markup.
- Block/report behavior across relaunch and offline/network recovery; try non-moderator access to queues.
- Correct Rainbow native icon inside IPA and installed home screen; no default Capacitor logo.
- Privacy policy link opens bundled notice; public hosted policy URL and App Store disclosure data checked.
- Test on real iPhone, with a moderator using supported sign-in from a desktop browser if in-app Google popup fails. Record build number/device/OS/tester/results.

## Release sequence (requires further authorization)
1. Pass Node and Firebase Emulator Suite tests, then smoke-test on an unsigned iPhone development build from this branch using manual Codemagic workflow `ios-device-unsigned`.
2. Review/moderator staffing commitment and privacy disclosures. Test website changes in staging before any published host/backend changes.
3. Plan coordinated website and `firestore.rules` production deployment; approve expected effect on old direct-post clients and rollback, and verify admin sign-in.
4. Re-test reporting/blocking/approval against the deployed backend on the proposed signed candidate and verify content is not publicly disclosed before review.
5. Integrate qualified changes to the canonical release branch by reviewed PR. Avoid accidental `main` push/testflight trigger.
6. Prepare signed App Store Connect candidate, verify exact SHA/version/IPA/icon, collect real beta/acceptance evidence, then request explicit approval for App Review resubmission.

## Apple review positioning
- iOS rejection remains Guideline 4.3 — Design: Spam. The existing owner's response was already sent in October. Do not claim Apple has approved the new implementation or send another repeated explanation.
- Show the differentiated, private recovery home, check-ins and plan, original recovery content and meeting context, alongside functional community safeguards. Guideline 1.2 also requires filtering, reporting, blocking, and accessible contact details; completion requires operational backend controls, moderated response procedures, and actual device testing.
