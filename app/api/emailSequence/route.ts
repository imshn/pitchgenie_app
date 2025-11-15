/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminAuth, adminDB } from "../../../lib/firebase-admin";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function clean(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function POST(req: Request) {
  try {
    // Auth
    const authH = req.headers.get("authorization") || "";
    const token = authH.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, leadId, name, role, company, website, companySummary } =
      await req.json();

    if (decoded.uid !== uid)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Prompt
    const prompt = `
Return ONLY JSON:

{
  "step1": "",
  "step2": "",
  "step3": "",
  "step4": "",
  "step5": ""
}

Write a 5-step cold email sequence for:

Lead:
${name}, ${role}, ${company}

Website: ${website}

Company Summary:
${companySummary}

Write:
- Step1: Cold email (80–120 words)
- Step2: Follow-up (short, <80 words)
- Step3: Value-add email (e.g. insights or idea)
- Step4: Case-study drop with example result
- Step5: Breakup email
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You write expert cold outreach sequences." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0].message?.content || "{}";
    const cleaned = clean(raw);
    const output = JSON.parse(cleaned);

    // Save to Firestore
    await adminDB.collection("leads").doc(leadId).update({
      sequence: output,
    });

    return NextResponse.json(output);
  } catch (e: any) {
    console.log("Sequence error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
