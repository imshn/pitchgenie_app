import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();

    // Revoke all refresh tokens for the user
    await adminAuth.revokeRefreshTokens(uid);

    return NextResponse.json({ success: true, message: "All sessions revoked" });
  } catch (error: any) {
    console.error("REVOKE TOKENS ERROR:", error);
    return NextResponse.json(
        { error: error.message || "Failed to revoke sessions" }, 
        { status: 500 }
    );
  }
}
