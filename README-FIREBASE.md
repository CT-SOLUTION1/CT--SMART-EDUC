# CT-SMART EDUC — Firebase

The updated HTML uses Firebase Firestore for the shared Teacher and Learner access codes.

## Intended behavior
- There are no hard-coded learner or teacher codes.
- Founder sets the shared Learner code.
- Founder sets the shared Teacher code.
- Founder can change/reset either code from the Founder Panel.
- A changed code is centralized in Firestore and applies across devices.
- Learners use one shared learner code.
- Teachers use one shared teacher code.
- No anonymous Firebase accounts are created.

## Important security architecture
The public browser must NOT be allowed to freely write the access document in production. The supplied Firestore rules therefore deny direct browser writes by default.

To make Founder code management work securely, the production version should use a protected Firebase Cloud Function/Admin SDK endpoint. That endpoint verifies the Founder and writes:
`systemSettings/access`

The public app can then read the current codes, while only the protected Founder operation can change them.

## Google Meet
The lesson button opens the configured Google Meet classroom; Jitsi is not used.
