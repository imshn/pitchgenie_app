import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { deductCredits, ActionType } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    // Verify Firebase token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Parse request body
    const body = await req.json();
    const { type } = body as { type: ActionType };

    if (!type) {
      return NextResponse.json(
        { error: "Missing action type" },
        { status: 400 }
      );
    }

    // Validate action type
    const validTypes: ActionType[] = ["email", "linkedin", "sequence", "scraper", "deliverability"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }

    // Deduct credits
    const result = await deductCredits(uid, type);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || "Failed to deduct credits",
          credits: result.credits 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      credits: result.credits,
    });
  } catch (error) {
    console.error("[Credits API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
