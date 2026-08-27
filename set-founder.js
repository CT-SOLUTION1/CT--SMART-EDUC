/*
 ONE-TIME FOUNDER CLAIM SETUP
 --------------------------------
 Run this script from a trusted machine after downloading a Firebase
 service-account JSON file from Firebase Console.

   npm install firebase-admin
   node set-founder.js <FOUNDER_UID>

 Never upload the service-account JSON or this script with credentials
 to GitHub, Vercel, Netlify, or Firebase Hosting.

 The founder UID is visible in Firebase Console -> Authentication -> Users.
*/
const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const uid = process.argv[2];

if (!serviceAccountPath || !uid) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON and pass the Founder UID.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath)))
});

admin.auth().setCustomUserClaims(uid, { founder: true })
  .then(() => {
    console.log("Founder claim set successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
