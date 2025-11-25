import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { logEvent } from "@/lib/analytics-server";
import { checkCredits, deductCredits } from "@/lib/credits";
import OpenAI from "openai";
import { verifyUser } from "@/lib/verify-user";
import { limiter } from "@/lib/rate-limit";
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const emailSequenceSchema = z.object({
  leadId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional(),
  company: z.string().min(1),
  website: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // ------------------ AUTH & RATE LIMIT ------------------
    const { uid, workspaceId } = await verifyUser();
    
    try {
      await limiter.check(10, uid); // 10 requests per minute
    } catch {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    // ------------------ INPUT VALIDATION ------------------
    const body = await req.json();
    const validation = emailSequenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { leadId, name, role, company, website } = validation.data;

    // ------------------ OWNERSHIP CHECK ------------------
    const leadRef = adminDB.collection("workspaces").doc(workspaceId).collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // ------------------ CREDIT CHECK ------------------
    const creditCheck = await checkCredits(workspaceId, "sequence");
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
Write a 4-step cold email sequence.

User Profile:
Name: ${profile.fullName || ""}
Role: ${profile.role || profile.position || ""}
Company: ${profile.company || ""}
Website: ${profile.website || ""}
LinkedIn: ${profile.linkedin || ""}
Location: ${profile.companyLocation || ""}
Services: ${Array.isArray(profile.services) ? profile.services.join(", ") : (profile.services || "")}
About: ${profile.about || ""}
Company Description: ${profile.companyDescription || profile.valueProposition || ""}
Tone: ${profile.persona || profile.personaTone || "professional"}

Lead Info:
Name: ${name}
Role: ${role || ""}
Company: ${company}
Website: ${website || ""}

Return JSON ONLY:
{
  "email1": "",
  "email2": "",
  "email3": "",
  "email4": ""
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message?.content || "{}";
    const sequence = JSON.parse(raw);

    // ------------------ SAVE TO FIRESTORE ------------------
    await leadRef.update({
      sequence,
      updatedAt: Date.now(),
    });

    // ------------------ ANALYTICS ------------------
    await logEvent(uid, {
      type: "sequence_generated",
      leadId,
      cost: 3,
      workspaceId,
    });

    // ------------------ DEDUCT CREDITS ------------------
    await deductCredits(workspaceId, "sequence");

    return NextResponse.json(sequence);
  } catch (err: any) {
    console.error("SEQUENCE ERROR:", err);
    if (err.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Sequence generation failed" },
      { status: 500 }
    );
  }
}
