import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { leadId, name, role, company, website } = await req.json();

    const profileSnap = await adminDB
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("main")
      .get();

    const profile = profileSnap.data() || {};

    const prompt = `
Write a 4-step cold email sequence.

Profile:
${profile.fullName || ""}, ${profile.position || ""}, ${profile.company || ""}
Services: ${profile.services || ""}

Lead:
${name}, ${role}, ${company}, ${website}

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
    });

    const raw = completion.choices[0].message?.content || "{}";
    const sequence = JSON.parse(raw);

    await adminDB.collection("leads").doc(leadId).update({
      sequence,
      updatedAt: Date.now(),
    });

    return NextResponse.json(sequence);
  } catch (err) {
    console.error("SEQUENCE ERROR:", err);
    return NextResponse.json(
      { error: "Sequence generation failed" },
      { status: 500 }
    );
  }
}
