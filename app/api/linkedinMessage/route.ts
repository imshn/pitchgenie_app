import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation } from "@/lib/server/checkAndConsumeOperation";
import { generateLinkedInMessageWithGroq } from "@/lib/groq/client";
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

    // Check and consume credits (1 credit for LinkedIn message)
    await checkAndConsumeOperation(uid, "linkedinMessage");

    // Generate LinkedIn message using Groq
    const result = await generateLinkedInMessageWithGroq({
      userProfile,
      lead: leadData,
      persona: userProfile?.persona || "Founder",
    });

    // Save LinkedIn message to lead document if leadId provided
    if (leadId) {
      await adminDB
        .collection("workspaces")
        .doc(currentWorkspaceId)
        .collection("leads")
        .doc(leadId)
        .update({
          linkedinMessage: {
            connectMessage: result.connectMessage,
            followUp: result.followUp,
            generatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        });
    }

    console.log(`[POST /api/linkedinMessage] Generated LinkedIn message for user ${uid}`);

    return NextResponse.json({
      connectMessage: result.connectMessage,
      followUp: result.followUp,
    });
  } catch (error: any) {
    console.error("[POST /api/linkedinMessage] Error:", error);

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
          message: error.message || "Failed to generate LinkedIn message"
        }
      },
      { status: 500 }
    );
  }
}
