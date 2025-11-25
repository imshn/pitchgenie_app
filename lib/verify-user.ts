import "server-only";
import { headers } from "next/headers";
import { adminAuth, adminDB } from "./firebase-admin";

export async function verifyUser() {
  const headersList = await headers();
  const authorization = headersList.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid Authorization header");
  }

  const token = authorization.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    return {
      uid,
      email: decodedToken.email,
      token: decodedToken,
      workspaceId, // Return the workspace ID
    };
  } catch (error) {
    console.error("Auth Error:", error);
    throw new Error("Unauthorized: Invalid token");
  }
}
