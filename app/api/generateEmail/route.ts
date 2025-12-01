import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation, checkOperationLimits } from "@/lib/server/checkAndConsumeOperation";
import { generateEmailWithOpenAI } from "@/lib/openai/client";
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
    const planData = await getUserPlan(uid);
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
    await checkOperationLimits(uid, "aiGeneration");

    // 2. Generate email using OpenAI (GPT-4o-mini)
    const result = await generateEmailWithOpenAI({
      userProfile,
      lead: leadData,
      companySummary: leadData?.aiSummary || null,
      persona: userProfile?.persona || "Founder",
    });

    // 3. Charge credits AFTER successful generation
    await checkAndConsumeOperation(uid, "aiGeneration");

    // Save generated email to lead document if leadId provided
    if (leadId) {
      await adminDB
        .collection("workspaces")
        .doc(currentWorkspaceId)
        .collection("leads")
        .doc(leadId)
        .update({
          lastGeneratedEmail: {
            subject: result.subject,
            body: result.body,
            followUp: result.followUp,
            generatedAt: new Date().toISOString(),
          },
          status: "contacted", // Auto-update status
          updatedAt: new Date().toISOString(),
        });
    }

    console.log(`[POST /api/generateEmail] Generated email for user ${uid}`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/generateEmail] Error:", error);

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
          message: error.message || "Failed to generate email"
        }
      },
      { status: 500 }
    );
  }
}
