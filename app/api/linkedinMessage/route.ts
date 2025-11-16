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

    const { name, role, company } = await req.json();

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
    });

    const raw = completion.choices[0].message?.content || "{}";
    const output = JSON.parse(raw);

    return NextResponse.json(output);
  } catch (err) {
    console.error("LINKEDIN ERROR:", err);
    return NextResponse.json(
      { error: "LinkedIn generation failed" },
      { status: 500 }
    );
  }
}
