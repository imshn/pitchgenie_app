import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { checkCredits, deductCredits } from "@/lib/credits";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { leadId, name, role, company } = await req.json();

    // ------------------ CREDIT CHECK ------------------
    const creditCheck = await checkCredits(uid, "linkedin");
    if (!creditCheck.ok) {
      return NextResponse.json(
        { 
          error: creditCheck.error === "INSUFFICIENT_CREDITS" 
            ? "Insufficient credits. Please upgrade your plan." 
            : "Credit check failed",
          code: creditCheck.error,
          credits: creditCheck.credits 
        },
        { status: 403 }
      );
    }

    const profileSnap = await adminDB
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("main")
      .get();

    const profile = profileSnap.data() || {};

    const prompt = `
Write 2 LinkedIn messages using:
User: ${profile.fullName} from ${profile.company}
Lead: ${name}, ${role} at ${company}

Return JSON:
{
  "connect": "",
  "followup": ""
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message?.content || "{}";
    const output = JSON.parse(raw);

    if (leadId) {
      await adminDB.collection("leads").doc(leadId).update({
        linkedinConnect: output.connect,
        linkedinFollowup: output.followup,
        updatedAt: Date.now(),
      });
    }

    // ------------------ DEDUCT CREDITS ------------------
    await deductCredits(uid, "linkedin");

    return NextResponse.json(output);
  } catch (err) {
    console.error("LINKEDIN ERROR:", err);
    return NextResponse.json(
      { error: "LinkedIn generation failed" },
      { status: 500 }
    );
  }
}
