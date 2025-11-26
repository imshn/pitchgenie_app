import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation } from "@/lib/server/checkAndConsumeOperation";
import { generateSequenceWithGroq } from "@/lib/groq/client";
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

    // Fetch lead data if leadId provided
    let leadData = lead;
    if (leadId && !lead) {
      const leadDoc = await adminDB.collection("leads").doc(leadId).get();
      if (!leadDoc.exists) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      leadData = leadDoc.data();
    }

    // Check and consume credits (3 credits for sequence)
    await checkAndConsumeOperation(uid, "emailSequence");

    // Generate sequence using Groq
    const result = await generateSequenceWithGroq({
      userProfile,
      lead: leadData,
      companySummary: leadData?.aiSummary || null,
      persona: userProfile?.persona || "Founder",
    });

    // Save sequence to lead document if leadId provided
    if (leadId) {
      await adminDB
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
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    if (error.message?.includes("SEQUENCE_LIMIT")) {
      return NextResponse.json(
        { error: "Sequence limit reached for your plan" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate sequence" },
      { status: 500 }
    );
  }
}
