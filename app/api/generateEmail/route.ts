import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { logEvent } from "@/lib/analytics-server";
import { checkCredits, deductCredits } from "@/lib/credits";
import OpenAI from "openai";
import { verifyUser } from "@/lib/verify-user";
import { limiter } from "@/lib/rate-limit";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const generateEmailSchema = z.object({
  leadId: z.string().min(1),
  name: z.string().min(1),
  company: z.string().min(1),
  role: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
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
    const validation = generateEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { leadId, name, company, role, website, email } = validation.data;

    // ------------------ OWNERSHIP CHECK ------------------
    const leadDoc = await adminDB.collection("leads").doc(leadId).get();
    if (!leadDoc.exists || leadDoc.data()?.userId !== uid) {
      return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
    }

    // ------------------ CREDIT CHECK ------------------
    const creditCheck = await checkCredits(uid, "email");
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
You write high-performing personalized cold emails.

User Profile:
Name: ${profile.fullName || ""}
Position: ${profile.position || ""}
Company: ${profile.company || ""}
Services: ${profile.services || ""}
About: ${profile.about || ""}
Tone: ${profile.personaTone || "professional"}
Value Proposition: ${profile.valueProposition || ""}

Lead Info:
Name: ${name}
Company: ${company}
Role: ${role || ""}
Website: ${website || ""}
Email: ${email || ""}

Generate:
1) subject line
2) email body
3) follow-up message

Return ONLY a JSON object:
{
  "subject": "",
  "body": "",
  "followUp": ""
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message?.content || "{}";
    const output = JSON.parse(raw);

    // ------------------ SAVE TO FIRESTORE ------------------
    await adminDB.collection("leads").doc(leadId).update({
      subject: output.subject,
      body: output.body,
      followUp: output.followUp,
      updatedAt: Date.now(),
    });

    // ------------------ ANALYTICS ------------------
    await logEvent(uid, {
      type: "email_generated",
      leadId,
      cost: 1,
    });

    // ------------------ DEDUCT CREDITS ------------------
    await deductCredits(uid, "email");

    return NextResponse.json(output);
  } catch (error: any) {
    console.error("GENERATE EMAIL ERROR:", error);
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
