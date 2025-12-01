import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { analyzeReplyWithOpenAI } from "@/lib/openai/client";
import { getUserPlan } from "@/lib/server/getUserPlan";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { replyText } = await req.json();

    if (!replyText) {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 });
    }

    // Get user plan data for profile
    const planData = await getUserPlan(uid);
    const userProfile = planData.profile;

    // Analyze reply using OpenAI
    // Note: Currently not charging credits for this operation as per existing logic
    const result = await analyzeReplyWithOpenAI(replyText, userProfile);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/analyzeReply] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze reply" },
      { status: 500 }
    );
  }
}
