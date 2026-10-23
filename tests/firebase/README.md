# Isolated Firebase authorization qualification

The emulator config is at `../../firebase.qualify.json` so rules resolve within the repository. From this directory run `npm install --no-audit --no-fund`, then `npm run test:rules` with Java 21 and Node 22 available. The test uses the **demo-rainbow-ios-qualify** project with only the local Firestore emulator, never production Firebase.

The script exercises denied anonymous publication and private reads; permitted pending submission, moderator approval, report creation/restrictions, moderation resolution, and deletion. Any denied operations must fail as expected.

This suite does **not** validate physical iPhone behavior, the live deployed rules, moderator operational readiness, or a signed Codemagic build. Record each separately before release.
