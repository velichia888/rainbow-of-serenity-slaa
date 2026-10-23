# Rainbow of Serenity Companion — iOS App Review remediation checkpoint
Date: 2026-10-22
Branch: `audit/ros-ios-app-review-readiness-20261022`, created from `feat/ros-1.1-recovery-home`.
Status: **Audit only — no App Store upload, no merge, no production/backend change.**

## Review history and identity
- Apple flagged iOS 1.0 under Guideline 4.3 (Design — Spam), with earlier correspondence also referencing 4.3(a), 4.3(b), and 4.2.6. The owner replied to Apple's nine questions on October 17; no newer iOS review message has been reported.
- Rainbow is a companion for the particular Rainbow of Serenity SLAA-related peer-support meeting/community created by the app owner. It should not be represented as the official app of the broader SLAA fellowship.
- The owner tested an unsigned development iPhone build on October 14 and reported it looked good throughout **except for the native blue Capacitor icon**. Avoid erasing this real feedback. However, that report is not equivalent to signed App Store candidate acceptance, moderation testing, or independent beta testing.
- Prior context refers to a signed App Store 1.0 build 2 uploaded/submitted October 14, then flagged October 15. This build's exact source SHA and bundled features have not been independently reconciled against the recovery-home branch. Before any new reviewer response or release, map the Apple-submitted build to an immutable Git commit and Codemagic artifact.

## Verified repository baseline
- Main is `e1b02d7e6c8a5ba3d684aa53e90d484988c1ee11` when audited.
- `feat/ros-1.1-recovery-home` was 5 commits ahead of main; its bundled `ios-app/www/index.html` contains the connected Recovery Home and local `ros_recovery_plan_v1` feature. Production merge remains unapproved.
- `development/ROS_IOS_NATIVE_ICON_FIX.md` says the native icon preparation script was integrated into the 1.1 branch. Actual rebuilt IPA icon and home-screen acceptance are **not** confirmed.
- The `ios-release` Codemagic workflow explicitly guards `main` and publishes to TestFlight; the 1.1 manual signed candidate requires its feature branch and has `submit_to_testflight: false` and `submit_to_app_store: false`. Never run a publishing workflow merely to test.
- Recovery plan, check-ins, and gratitude use local WebView storage; 1.1 adds no encryption, automatic sync, or backup. Do not represent them otherwise.

## Open PR reconciliation
- PR #16 (private 12-step journal / share-as-image) changes **only `app/index.html`**, NOT `ios-app/www/index.html`. A regular merge would not alone put the journal in the iOS packaged companion. Review for recovery-specific value, then deliberately port and test any approved implementation in native assets.
- PR #17 (moderated photo gallery) changes `app/gallery.js`, `app/index.html`, service worker, `docs/feed-setup.md`, and `firestore.rules`. The proposed backend rules require explicit deployment; do NOT assume gallery moderation is live. Introducing image UGC increases 1.2 safety and privacy testing scope. Defer from initial review-remediation release unless independently qualified.
- PR #18 adds a privacy policy page but remains unmerged. Policy text may describe PR #17 gallery features not currently in the iOS binary. Reconcile with the deployed backend and shipped binary before inclusion and verify hosted policy URL.
- None of PRs #16–18 should be mass-merged without review of base drift and mobile resource packaging.

## Release blockers
1. **Guideline 4.3/4.2 experience**: Demonstrate a differentiated recovery workflow and avoid shipping a generic public website wrapper. Requalify actual bundled iOS companion entry point. If adding step work, preserve users' existing localStorage keys and offline functions.
2. **Guideline 1.2 user-generated content**: The current public Firestore Community feed has anonymous posting, link/rate constraints, and moderator delete, but source inspection did not find member-facing report-post, block-user, or a complete objectionable-content filtering/moderation workflow. Build those controls or explicitly redesign the Community surface before review. Validate Firebase authorization rules in emulator and live deployment; do not claim compliance based on client UI alone.
3. **Privacy**: Produce an accurate, accessible privacy policy, matching locally stored recovery information, Firebase anonymous sign-in/community data and actual retention/deletion; ensure App Store privacy disclosures match runtime data flow. Do not claim local recovery text is encrypted or synced.
4. **Signed build provenance**: Verify build-number/version, bundle ID `com.rainbowofserenity.companion`, packaging source SHA, correct native icon inside IPA, and the intended review binary.
5. **Device acceptance**: Retest launch page, stored progress, check-in, plan save/reopen/delete, offline state, accessibility/VoiceOver/text size, community report/block, moderation, privacy policy, icon, and crashes using fictional data. Record tester, device, OS, build, results, and actual feedback.
6. **App Review package**: Prepare truthful review notes/screenshots/video focused on distinct member workflow; include functionality only if present in the exact binary. Existing nine-question response is already sent; do not send it again without new information.

## Change and release boundaries
- Remediation work should occur in a dedicated development branch and be qualified before integrating back to the 1.1 branch and then main.
- Never modify `main`, deploy Firestore rules, sign/upload a build, publish, or submit for App Review until the owner has approved the qualified candidate.
- Preserve old user's local recovery records; never reset storage or replace the installed app before a verified migration/backup path.
- Treat all review, Apple, and beta status claims as unverified until backed by the relevant system's record.

## Initial action order
A. Verify the current iOS bundle and open PR integration targets; do not blindly merge.
B. Design member report/block, objectionable-post filtering, moderator queue/response and contact mechanisms with testable Firestore rules.
C. Reconcile privacy policy and mobile links.
D. Integrate only approved recovery-specific differentiating features, with source and device tests.
E. Qualify a complete candidate; *then* discuss new Apple submission or appeal depending on the latest review response.
