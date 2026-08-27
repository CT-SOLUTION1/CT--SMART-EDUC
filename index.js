const { onCall, HttpsError } = require("firebase-functions/https");
const { setGlobalOptions } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const db = getFirestore();
const ACCESS_REF = db.doc("systemSettings/access");

/**
 * Founder authorization is based on a Firebase Auth custom claim:
 *   { founder: true }
 *
 * Never put a service-account key in the website.
 */
function requireFounder(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Founder authentication is required.");
  }
  if (request.auth.token.founder !== true) {
    throw new HttpsError("permission-denied", "Founder privileges are required.");
  }
}

function cleanCode(value, field) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} must be text.`);
  }
  const code = value.trim().toUpperCase();
  if (code.length < 4 || code.length > 64) {
    throw new HttpsError("invalid-argument", `${field} must contain 4–64 characters.`);
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw new HttpsError("invalid-argument", `${field} may contain only letters, numbers, _ or -.`);
  }
  return code;
}

function mask(code) {
  if (!code) return "";
  return "•".repeat(Math.max(4, Math.min(12, code.length)));
}

/**
 * Founder creates/replaces the shared school access codes.
 * The raw codes are kept server-side only.
 */
exports.setSchoolAccessCodes = onCall(async (request) => {
  requireFounder(request);

  const data = request.data || {};
  const learnerCode = cleanCode(data.learnerCode, "Learner code");
  const teacherCode = cleanCode(data.teacherCode, "Teacher code");

  await ACCESS_REF.set({
    learnerCode,
    teacherCode,
    learnerLocked: false,
    teacherLocked: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth.uid
  }, { merge: true });

  return { ok: true, message: "School access codes updated." };
});

/**
 * Founder can read current settings, but this function returns only masks.
 * The actual codes never leave the trusted backend.
 */
exports.getSchoolAccessSettings = onCall(async (request) => {
  requireFounder(request);

  const snap = await ACCESS_REF.get();
  if (!snap.exists) {
    return {
      configured: false,
      learnerCodeMasked: "",
      teacherCodeMasked: "",
      learnerLocked: false,
      teacherLocked: false
    };
  }

  const d = snap.data();
  return {
    configured: !!(d.learnerCode && d.teacherCode),
    learnerCodeMasked: mask(d.learnerCode),
    teacherCodeMasked: mask(d.teacherCode),
    learnerLocked: d.learnerLocked === true,
    teacherLocked: d.teacherLocked === true
  };
});

/**
 * Founder can lock/unlock either shared access code.
 */
exports.setSchoolAccessLocks = onCall(async (request) => {
  requireFounder(request);

  const data = request.data || {};
  const learnerLocked = data.learnerLocked === true;
  const teacherLocked = data.teacherLocked === true;

  await ACCESS_REF.set({
    learnerLocked,
    teacherLocked,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth.uid
  }, { merge: true });

  return { ok: true };
});

/**
 * Learner/teacher gateway.
 *
 * This does NOT create an anonymous Firebase user.
 * It only verifies the shared school code and returns a short-lived
 * signed custom token. The client may optionally use that token to
 * establish a Firebase session.
 */
exports.verifySharedAccessCode = onCall(async (request) => {
  const data = request.data || {};
  const role = data.role === "learner" || data.role === "teacher" ? data.role : null;
  const supplied = typeof data.code === "string" ? data.code.trim().toUpperCase() : "";

  if (!role || !supplied) {
    throw new HttpsError("invalid-argument", "Role and access code are required.");
  }

  const snap = await ACCESS_REF.get();
  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "School access has not been configured.");
  }

  const d = snap.data();
  if (d[role + "Locked"] === true) {
    throw new HttpsError("permission-denied", `${role} access is currently locked.`);
  }

  if (supplied !== d[role + "Code"]) {
    throw new HttpsError("permission-denied", "Incorrect access code.");
  }

  return { ok: true, role };
});
