import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

const servicePath = path.join(process.cwd(), "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(servicePath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export const adminDB = admin.firestore();
