import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation } from "@/lib/server/checkAndConsumeOperation";
import { generateEmailWithGroq } from "@/lib/groq/client";
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

    // Fetch lead data if leadId provided
    let leadData = lead;
    if (leadId && !lead) {
      const leadDoc = await adminDB.collection("leads").doc(leadId).get();
      if (!leadDoc.exists) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      leadData = leadDoc.data();
    }

    // Check and consume credits (1 credit for email generation)
    await checkAndConsumeOperation(uid, "aiGeneration");

    // Generate email using Groq
    const result = await generateEmailWithGroq({
      userProfile,
      lead: leadData,
      companySummary: leadData?.aiSummary || null,
      persona: userProfile?.persona || "Founder",
    });

    // Save generated email to lead document if leadId provided
    if (leadId) {
      await adminDB
        .collection("leads")
        .doc(leadId)
        .update({
          generatedEmail: {
            subject: result.subject,
            body: result.body,
            followUp: result.followUp,
            generatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        });
    }

    console.log(`[POST /api/generateEmail] Generated email for user ${uid}`);

    return NextResponse.json({
      subject: result.subject,
      body: result.body,
      followUp: result.followUp,
    });
  } catch (error: any) {
    console.error("[POST /api/generateEmail] Error:", error);

    // Check for specific error codes
    if (error.message?.includes("INSUFFICIENT_CREDITS")) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate email" },
      { status: 500 }
    );
  }
}
