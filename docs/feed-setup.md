# Turning on the Community feed

The Community tab in the Companion app (`app/index.html`) stores posts in
Firebase Firestore. It's free at our size, updates live for everyone, and
members don't need an account. Setup takes about ten minutes and only has to be
done once.

1. Go to <https://console.firebase.google.com> and sign in with the group's
   Google account (rainbowofserenityslaa@gmail.com).
2. **Add project** → name it `rainbow-of-serenity`. Google Analytics can be
   turned off.
3. In the left menu open **Build → Firestore Database** → **Create database**.
   Pick a location near Arizona (for example `us-west`) and start in
   **production mode**.
4. Open the **Rules** tab, replace everything with the contents of
   [`firestore.rules`](../firestore.rules) from this repo, and click
   **Publish**.
5. Go to **Project settings** (gear icon) → **Your apps** → the `</>` (Web)
   button. Name it `companion`, skip Hosting, and click **Register app**.
6. Open **Build → Authentication** → **Get started**. On **Sign-in method**,
   turn on **Anonymous** and **Google**. Then under **Settings → Authorized
   domains**, add `velichia888.github.io`.
7. Firebase shows a `firebaseConfig` block. Copy the `apiKey`, `authDomain`,
   `projectId` and `appId` values into the `firebaseConfig` object near the
   bottom of `app/index.html`.

The web config isn't a secret; it's meant to sit in the page. The rules in
`firestore.rules` are what protect the data. Members never see a sign-in: the
app signs each visitor in anonymously behind the scenes, and the rules use that
to allow one post per device every 30 seconds. Posts are capped at 500
characters, links are blocked, and nobody can edit posts.

## Moderating

Open the app with `#moderate` at the end of the address
(`.../app/#moderate`), go to the Community tab, and tap **Moderator sign-in**
at the bottom. Sign in with a moderator Google account and each post gets a
**Remove** button.

Moderators are listed in two places that must match: `MODERATORS` in
`app/index.html` and `isModerator()` in `firestore.rules` (republish the rules
in the Firebase console after changing them).

You can also remove a post from **Firestore Database → Data → feed** in the
Firebase console.
