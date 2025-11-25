import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(params: FirebaseAdminConfig) {
  const privateKey = formatPrivateKey(params.privateKey);

  if (admin.apps.length > 0) {
    return admin.app();
  }

  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey,
  });

  return admin.initializeApp({
    credential: cert,
    projectId: params.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function initAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error("Firebase Admin: Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", error);
    }
  }

  // Fallback for local dev if file exists (optional, but better to use env)
  // In production, this block should ideally not be reached if env is set
  if (process.env.NODE_ENV === "development") {
     try {
       // eslint-disable-next-line @typescript-eslint/no-var-requires
       const serviceAccount = require("../pitchgenie-33c93-firebase-adminsdk-fbsvc-3cd510ee15.json");
       return admin.initializeApp({
         credential: admin.credential.cert(serviceAccount),
         storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
       });
     } catch (e) {
       console.warn("Firebase Admin: No serviceAccountKey.json found in dev mode.");
     }
  }

  throw new Error("Firebase Admin: Failed to initialize. Missing GOOGLE_SERVICE_ACCOUNT_JSON.");
}

// Initialize once
const app = initAdmin();

export const adminAuth = app.auth();
export const adminDB = app.firestore();
export const adminStorage = app.storage();
export const FieldValue = admin.firestore.FieldValue;
