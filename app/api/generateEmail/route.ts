import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // ------------------ AUTH ------------------
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // ------------------ INPUT ------------------
    const { leadId, name, company, role, website, email } = await req.json();

    if (!leadId || !name || !company) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
Role: ${role}
Website: ${website}
Email: ${email}

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

    return NextResponse.json(output);
  } catch (error) {
    console.error("GENERATE EMAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
