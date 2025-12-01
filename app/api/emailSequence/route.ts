import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation, checkOperationLimits } from "@/lib/server/checkAndConsumeOperation";
import { generateSequenceWithOpenAI } from "@/lib/openai/client";
import { getUserPlan } from "@/lib/server/getUserPlan";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { leadId, lead } = await req.json();

    if (!leadId && !lead) {
      return NextResponse.json(
        { error: "leadId or lead data is required" },
        { status: 400 }
      );
    }

    // Get user plan data for profile
    const planData =await getUserPlan(uid);
    const userProfile = planData.profile;

    // Fetch workspace ID
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const currentWorkspaceId = userDoc.data()?.currentWorkspaceId;

    if (!currentWorkspaceId) {
        return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Fetch lead data if leadId provided
    let leadData = lead;
    if (leadId && !lead) {
      const leadDoc = await adminDB
        .collection("workspaces")
        .doc(currentWorkspaceId)
        .collection("leads")
        .doc(leadId)
        .get();

      if (!leadDoc.exists) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      leadData = leadDoc.data();
    }

    // 1. Check limits BEFORE generation (Read-only)
    await checkOperationLimits(uid, "emailSequence");

    // 2. Generate sequence using OpenAI
    const result = await generateSequenceWithOpenAI({
      userProfile,
      lead: leadData,
      companySummary: leadData?.aiSummary || null,
      persona: userProfile?.persona || "Founder",
    });

    // 3. Charge credits AFTER successful generation
    await checkAndConsumeOperation(uid, "emailSequence");

    // Save sequence to lead document if leadId provided
    if (leadId) {
      await adminDB
        .collection("workspaces")
        .doc(currentWorkspaceId)
        .collection("leads")
        .doc(leadId)
        .update({
          sequence: {
            emails: result.sequence,
            generatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        });
    }

    console.log(`[POST /api/emailSequence] Generated sequence for user ${uid}`);

    return NextResponse.json({
      sequence: result.sequence,
    });
  } catch (error: any) {
    console.error("[POST /api/emailSequence] Error:", error);

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

    if (error.message?.includes("SEQUENCE_LIMIT")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "LIMIT_EXCEEDED",
            message: "Monthly sequence limit reached. Upgrade plan."
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to generate sequence"
        }
      },
      { status: 500 }
    );
  }
}
