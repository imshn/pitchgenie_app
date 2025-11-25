import "server-only";
import { headers } from "next/headers";
import { adminAuth } from "./firebase-admin";

export async function verifyUser() {
  const headersList = await headers();
  const authorization = headersList.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid Authorization header");
  }

  const token = authorization.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      token: decodedToken,
    };
  } catch (error) {
    console.error("Auth Error:", error);
    throw new Error("Unauthorized: Invalid token");
  }
}
