# Rainbow of Serenity 1.1 — Recovery Home checkpoint

Branch: `feat/ros-1.1-recovery-home`. Base: `e1b02d7e6c8a5ba3d684aa53e90d484988c1ee11` on `main`.

## Included
- Connected daily home: today's saved check-in status plus direct navigation to check-in, original reading, next meeting, and affirmation.
- Personal `My Recovery Plan`: signs to notice, reconnecting actions, and trusted support resources. Stored under new `ros_recovery_plan_v1` browser localStorage key.
- Existing `ros_clean_date`, `ros_checkins`, `ros_gratitude` keys are unchanged. No migration or reset.
- Native build packaging uses the checked-in `ios-app/www/` companion as `www/index.html`, instead of copying the public website homepage over the app.
- Source smoke test: `node --test tests/recovery-home.test.cjs`.

## Limitations / privacy
- Recovery-plan text is stored locally, not encrypted by this feature and not uploaded by it; devices with access to the app could read it. No account sync or backup is implemented.
- The community feed remains separate and requires network access. No moderation/privacy approvals are implied.
- This is **not** a clinical or crisis response tool.
- Device acceptance, actual Codemagic signing, TestFlight, App Store differentiation, and external beta feedback are **not yet verified**.

## Acceptance checks
1. Launch iOS build; ensure first screen says `Your recovery, your pace`, not the public website homepage.
2. Existing recovery date/chips and previous check-ins still appear.
3. Save a new check-in; returning to Home should say it was completed today. Reopen the app to confirm persistence.
4. Save a recovery plan; close/reopen app; expand plan and confirm values remain. Delete it, confirm, and verify it does not return.
5. With Airplane Mode on, local dashboard, plan, and readings still function. Community feed should show offline state.
6. Verify larger text, VoiceOver labels, device layout, and no crashes.
7. Collect documented feedback from real external TestFlight testers before preparing the next review response.

Do not merge this branch to `main` or trigger a publishing workflow until qualification and user acceptance.
