import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation, checkOperationLimits } from "@/lib/server/checkAndConsumeOperation";
import { checkDeliverabilityWithOpenAI } from "@/lib/openai/client";
import { getUserPlan } from "@/lib/server/getUserPlan";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { subject, body } = await req.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Get user plan data for profile
    const planData = await getUserPlan(uid);
    const userProfile = planData.profile;

    // 1. Check limits BEFORE generation (Read-only)
    await checkOperationLimits(uid, "deliverabilityCheck");

    // 2. Check deliverability using OpenAI
    const result = await checkDeliverabilityWithOpenAI(subject, body, userProfile);

    // 3. Charge credits AFTER successful generation
    await checkAndConsumeOperation(uid, "deliverabilityCheck");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/deliverabilityCheck] Error:", error);

    // Check for specific error codes
    if (error.message?.includes("INSUFFICIENT_CREDITS")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Insufficient monthly credits. Please upgrade your plan."
          }
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to check deliverability"
        }
      },
      { status: 500 }
    );
  }
}
