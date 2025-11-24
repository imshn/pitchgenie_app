import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // -------------------------------
    // AUTHENTICATION
    // -------------------------------
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, subject, body } = await req.json();

    if (decoded.uid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // -------------------------------
    // PROMPT
    // -------------------------------
    const prompt = `
You are an expert cold email deliverability engine.

Return STRICTLY valid JSON ONLY — no extra text.

TASKS:
1. Rewrite the cold email for maximum deliverability.
2. Remove spam-trigger words.
3. Return:
{
  "subject": "...",
  "body": "...",
  "score": number (0-100 deliverability score),
  "spam_words": ["..."]
}

OR RETURN NOTHING BUT VALID JSON.

Email:
Subject: ${subject}
Body:
${body}
    `;

    // -------------------------------
    // OPENAI CALL
    // -------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: 'json_object' },
    });

    let raw = completion.choices[0].message?.content || "{}";

    // -------------------------------
    // SAFE JSON PARSE
    // -------------------------------
    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error("JSON PARSE FAILED RAW OUTPUT:\n", raw);

      return NextResponse.json(
        {
          error: "OpenAI returned invalid JSON",
          rawOutput: raw,
        },
        { status: 500 }
      );
    }

    // -------------------------------
    // SUCCESS
    // -------------------------------
    return NextResponse.json(json);
  } catch (e) {
    console.error("DELIVERABILITY ERROR:", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
