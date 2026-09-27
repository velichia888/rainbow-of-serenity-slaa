# Rainbow Companion — iOS build via Codemagic

This folder is a Capacitor project that wraps the existing Rainbow Companion
web app (`app/index.html` in the main site repo) as a native iOS app. It has
no native iOS project checked in yet — Codemagic generates that on every
build from `npx cap add ios`, so there's nothing to build locally first.

## What's in here
- `www/` — the app's web assets (copied from `app/`, with paths fixed and
  the service worker removed since it isn't needed in a native shell)
- `package.json` — Capacitor dependencies
- `capacitor.config.json` — app ID, name, and native config
- `codemagic.yaml` — the CI build pipeline

## One-time setup

### 1. Push this to a repo Codemagic can see
Either add these files to the existing `rainbow-of-serenity-slaa` repo (e.g.
in a new `ios-app/` folder, adjusting paths in `codemagic.yaml` if you do)
or create a new repo just for the iOS wrapper. A separate repo is usually
cleaner since this has its own build pipeline and dependencies.

### 2. Apple Developer account
You'll need the paid Apple Developer Program account ($99/yr) active before
any of the signing steps below will work.

### 3. Register the App ID
In [developer.apple.com](https://developer.apple.com) → Certificates,
Identifiers & Profiles → Identifiers → **+**, register:
```
com.rainbowofserenity.companion
```
(This must match `appId` in `capacitor.config.json` and `BUNDLE_ID` in
`codemagic.yaml` exactly.)

### 4. Create the app record in App Store Connect
In App Store Connect → Apps → **+** → New App, using the bundle ID above and
the name/description/keywords/screenshots we already put together.

### 5. Connect Codemagic
- Sign up / log in at [codemagic.io](https://codemagic.io) with the account
  that should own this app.
- Add your repo (GitHub) as an app in Codemagic.
- Codemagic will detect `codemagic.yaml` in the repo root automatically.

### 6. Add the App Store Connect API key integration
This lets Codemagic sign the build and upload to TestFlight without you
manually managing certificates.
- App Store Connect → Users and Access → Integrations → **App Store Connect
  API** → generate a new key with **App Manager** access. Download the
  `.p8` key (you only get one download).
- In Codemagic → Team settings → Integrations → **App Store Connect** → add
  it, name it `rainbow_companion_asc` (matching the name used in
  `codemagic.yaml`), and upload the Issuer ID, Key ID, and the `.p8` file.

### 7. Trigger the build
Push to `main` (or click **Start new build** in Codemagic). The pipeline:
1. Installs npm dependencies
2. Generates the iOS project (`npx cap add ios`)
3. Syncs the web assets in
4. Installs CocoaPods
5. Signs automatically using the App Store Connect integration
6. Builds the `.ipa`
7. Uploads it to TestFlight

`submit_to_app_store` is set to `false` in `codemagic.yaml` so the first few
builds only go to TestFlight — flip it to `true` once you've tested a build
on a real device and you're ready to submit for App Store review.

## After the first successful build
- Check TestFlight in App Store Connect — the build should appear within a
  few minutes of the Codemagic run finishing.
- Install it via the TestFlight app on your iPhone to test the Community
  feed, recovery counter, and check-ins actually work in the native shell.
- Once you're happy, submit that build for review from App Store Connect
  (or flip `submit_to_app_store: true` and let Codemagic do it next run).
