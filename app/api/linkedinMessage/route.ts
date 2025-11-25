import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { checkCredits, deductCredits } from "@/lib/credits";
import OpenAI from "openai";
import { verifyUser } from "@/lib/verify-user";
import { limiter } from "@/lib/rate-limit";
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const linkedinMessageSchema = z.object({
  leadId: z.string().min(1).optional(),
  name: z.string().min(1),
  role: z.string().optional(),
  company: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    // ------------------ AUTH & RATE LIMIT ------------------
    const { uid } = await verifyUser();
    
    try {
      await limiter.check(10, uid); // 10 requests per minute
    } catch {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // ------------------ INPUT VALIDATION ------------------
    const body = await req.json();
    const validation = linkedinMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { leadId, name, role, company } = validation.data;

    // ------------------ OWNERSHIP CHECK ------------------
    if (leadId) {
      const leadDoc = await adminDB.collection("leads").doc(leadId).get();
      if (!leadDoc.exists || leadDoc.data()?.userId !== uid) {
        return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
      }
    }

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

    // ------------------ FETCH PROFILE ------------------
    const profileSnap = await adminDB
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("main")
      .get();

    const profile = profileSnap.data() || {};

    // ------------------ AI GENERATION ------------------
    const prompt = `
Write 2 LinkedIn messages using:
User: ${profile.fullName || ""} from ${profile.company || ""}
Lead: ${name}, ${role || ""} at ${company}

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
  } catch (err: any) {
    console.error("LINKEDIN ERROR:", err);
    if (err.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "LinkedIn generation failed" },
      { status: 500 }
    );
  }
}
