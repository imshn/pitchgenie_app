import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { ActionType } from "@/lib/credits";
import { CreditOperation } from "@/lib/types/plans";

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

    // Map ActionType to CreditOperation
    let operation: CreditOperation;
    switch (type) {
        case "email":
            operation = "aiGeneration";
            break;
        case "linkedin":
            operation = "linkedinMessage";
            break;
        case "sequence":
            operation = "emailSequence";
            break;
        case "scraper":
            operation = "lightScrape";
            break;
        case "deliverability":
            operation = "deliverabilityCheck";
            break;
        default:
            return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
    }

    // Deduct credits
    const { checkAndConsumeOperation } = await import("@/lib/server/checkAndConsumeOperation");
    
    try {
        await checkAndConsumeOperation(uid, operation);
        
        // We don't get exact remaining credits from checkAndConsumeOperation easily without another call,
        // but the client usually refreshes or we can return 0/success.
        // The original returned result.credits.
        
        return NextResponse.json({
            success: true,
            credits: 0, // Placeholder, client should refresh
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to deduct credits";
        return NextResponse.json(
            { 
              error: msg,
              credits: 0 
            },
            { status: 403 }
        );
    }
  } catch (error) {
    console.error("[Credits API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
