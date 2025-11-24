import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, replyText } = await req.json();
    if (decoded.uid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const prompt = `
You analyze cold email replies.

Return STRICT JSON ONLY, no commentary.

Analyze this reply:

"${replyText}"

Return JSON:
{
  "sentiment": "interested | positive | neutral | negative | not_interested | pricing_question | more_info",
  "summary": "summary of what they said",
  "reply": "recommended AI reply text"
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: 'json_object' },
    });

    let raw = completion.choices[0].message?.content || "{}";

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error("Invalid JSON:", raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(json);
  } catch (e) {
    console.error("ANALYZE ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
