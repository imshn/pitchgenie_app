/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminAuth, adminDB } from "../../../lib/firebase-admin";

// Initialize OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // 1️⃣ Verify Firebase Auth Token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Missing Firebase token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uidFromToken = decoded.uid;

    // 2️⃣ Body Data
    const { leadId, uid, name, company, role, website } = await req.json();

    if (uidFromToken !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3️⃣ Fetch user (credits)
    const userRef = adminDB.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.credits <= 0) {
      return NextResponse.json({ error: "No credits left" }, { status: 400 });
    }

    // 4️⃣ Fetch company summary using DuckDuckGo
    let summary = "No company summary found.";
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(
          company + " " + website
        )}&format=json`
      );
      const data = await ddgRes.json();

      summary =
        data?.Abstract ||
        data?.AbstractText ||
        data?.RelatedTopics?.[0]?.Text ||
        summary;
    } catch (e) {
      console.log("DuckDuckGo failed:", e);
    }

    // 5️⃣ Prompt for GPT
    const prompt = `
Write JSON ONLY. Format:

{
  "subject": "",
  "body": "",
  "followUp": ""
}

Lead:
Name: ${name}
Role: ${role}
Company: ${company}
Website: ${website}

Company Summary:
${summary}

Write:
- subject: short and catchy
- body: 70-90 words, value-driven, human, casual
- followUp: 50-70 words
`;

    // 6️⃣ OpenAI Generation
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate high converting B2B cold emails." },
        { role: "user", content: prompt },
      ],
      temperature: 0.85,
    });

    const text = completion.choices[0].message?.content || "{}";

    let output;
    try {
      output = JSON.parse(text);
    } catch (err) {
      console.log("AI JSON Parse Error:", text);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // 7️⃣ Update lead
    const leadRef = adminDB.collection("leads").doc(leadId);
    await leadRef.update({
      aiSummary: summary,
      subject: output.subject,
      body: output.body,
      followUp: output.followUp,
    });

    // 8️⃣ Deduct credit
    await userRef.update({
      credits: userData.credits - 1,
    });

    return NextResponse.json({
      success: true,
      subject: output.subject,
      body: output.body,
      followUp: output.followUp,
    });
  } catch (e: any) {
    console.error("AI Generation Error:", e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e.message },
      { status: 500 }
    );
  }
}
