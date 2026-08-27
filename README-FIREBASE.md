# CT-SMART EDUC — Secure Firebase package

## What this version does
- No learner or teacher code is hard-coded into `index.html`.
- All learners can use one shared Learner code.
- All teachers can use one shared Teacher code.
- Only the Founder can change the shared codes from the Founder Panel.
- Code changes are written by a privileged Cloud Function using the Firebase Admin SDK.
- Browser users cannot directly write the Firestore access document.
- Learners and teachers do not get anonymous Firebase accounts.
- The code verification endpoint is a callable Cloud Function; Firebase automatically carries/validates the caller's Auth/App Check context for callable requests. See Firebase's callable-function documentation.
- Jitsi is removed; the site opens the Google Meet classroom.

## Security model
The Cloud Function `setSchoolAccessCodes` requires a Firebase Authentication custom claim:
`founder: true`

The Cloud Function `getSchoolAccessSettings` is Founder-only and returns only masked codes.

The Cloud Function `verifySharedAccessCode` checks the shared learner/teacher code server-side. The raw access codes are not stored in or read directly by the browser.

Firestore rules deny all direct browser access to `systemSettings/access`.

Firebase documents that custom claims should be set only from a privileged server environment using the Admin SDK, and callable functions automatically validate Firebase Auth tokens. citeturn0search0turn0search9

## Files
- `index.html` — website
- `firebase.json` — Hosting + Functions configuration
- `firestore.rules` — database locked to client access
- `functions/index.js` — secure Cloud Functions
- `functions/package.json` — Functions dependencies
- `set-founder.js` — one-time trusted-machine Founder claim setup helper
- `README-FIREBASE.md` — this guide

## Deployment
From the project folder:

1. Install Firebase CLI.
2. `firebase login`
3. `firebase use ct-e-school-solutions`
4. `firebase deploy --only functions,firestore,hosting`

Firebase's current documentation supports Node.js Cloud Functions and the Admin SDK for trusted Firestore/Auth operations. citeturn0search2turn0search6

## First-time Founder setup
The Founder must first have a normal Firebase Authentication account (Email/Password is fine).

Then, from a trusted computer, assign the custom claim:

`founder: true`

using `set-founder.js`.

Do NOT put a service-account JSON file in the website folder, GitHub, or the deployed Hosting files.

After the claim is assigned, the Founder signs into the site, opens the Founder Panel, and sets the shared Teacher and Learner codes.

## Important design note
A shared learner/teacher code is a gateway, not an individual user identity. Anyone who knows the current learner code can enter the Learner Dashboard. If you later want individual learner records, attendance, marks, or audit trails tied to a person, add individual Firebase Authentication accounts or another school identity system.
