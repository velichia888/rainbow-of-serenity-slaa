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
6. Firebase shows a `firebaseConfig` block. Copy the `apiKey`, `authDomain`,
   `projectId` and `appId` values into the `firebaseConfig` object near the
   bottom of `app/index.html`.

The web config isn't a secret; it's meant to sit in the page. The rules in
`firestore.rules` are what protect the data: anyone can read and post, posts
are capped at 500 characters, and nobody can edit or delete posts from the app.

## Moderating

To remove a post, open **Firestore Database → Data → feed** in the Firebase
console, find the post, and delete the document.
