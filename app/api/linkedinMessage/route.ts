/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminAuth, adminDB } from "../../../lib/firebase-admin";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function cleanJSON(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, leadId, name, role, company, website, companySummary } =
      await req.json();

    if (decoded.uid !== uid)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const prompt = `
Return ONLY valid JSON, without backticks or code blocks.

Format:

{
  "connect": "",
  "followup": ""
}

Create:
1. A short LinkedIn connection message (< 300 chars)
2. One follow-up message sent after they accept

Lead Info:
Name: ${name}
Role: ${role}
Company: ${company}
Website: ${website}

Company Summary:
${companySummary}

Remember:
- NO backticks
- NO code fences
- JSON ONLY
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate LinkedIn outreach messages." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const raw = completion.choices[0].message?.content || "{}";
    const cleaned = cleanJSON(raw);

    let output;
    try {
      output = JSON.parse(cleaned);
    } catch (e) {
      console.error("AI RAW:", raw);
      console.error("CLEANED:", cleaned);
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw },
        { status: 500 }
      );
    }

    await adminDB.collection("leads").doc(leadId).update({
      linkedinConnect: output.connect,
      linkedinFollowup: output.followup,
    });

    return NextResponse.json(output);
  } catch (e: any) {
    console.error("LinkedIn Error:", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
