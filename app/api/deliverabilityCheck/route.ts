import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
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
    // FETCH USER PROFILE FOR PLACEHOLDERS
    // -------------------------------
    const profileSnap = await adminDB.collection("users").doc(uid).collection("profile").doc("main").get();
    const profile = profileSnap.data() || {};
    
    // Fallback to user doc for basic info if needed
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data() || {};

    const userProfile = {
      name: profile.fullName || userData.displayName || userData.name || "User",
      email: userData.email || "",
      company: profile.company || userData.company || "Your Company",
      role: profile.role || profile.position || userData.position || userData.role || "Your Role",
      phone: userData.phone || "",
      website: profile.website || userData.website || "",
      linkedin: profile.linkedin || userData.linkedin || "",
      location: profile.companyLocation || "",
      services: Array.isArray(profile.services) ? profile.services.join(", ") : (profile.services || ""),
      about: profile.about || "",
      companyDescription: profile.companyDescription || profile.valueProposition || "",
      persona: profile.persona || profile.personaTone || "professional"
    };

    // Count words for length-based scoring
    const wordCount = body.trim().split(/\s+/).length;

    // -------------------------------
    // PROMPT
    // -------------------------------
    const prompt = `
You are a STRICT email deliverability analyzer. Find EVERY issue AND ACTUALLY FIX THEM.

CRITICAL: You MUST rewrite the email with REAL improvements. Don't just list issues - ACTUALLY CHANGE THE TEXT.

USER PROFILE DATA (use this to replace placeholders):
- Name: ${userProfile.name}
- Company: ${userProfile.company}
- Role: ${userProfile.role}
- Email: ${userProfile.email}
- Phone: ${userProfile.phone || '[Your Phone Number]'}
- LinkedIn: ${userProfile.linkedin || '[Your LinkedIn Profile]'}
- Website: ${userProfile.website || '[Your Website]'}
- Location: ${userProfile.location}
- Services: ${userProfile.services}
- About: ${userProfile.about}
- Company Description: ${userProfile.companyDescription}
- Tone: ${userProfile.persona}

ANALYZE AND IMPROVE THIS EMAIL:

Subject: ${subject}
Body: ${body}

REQUIRED CHECKS (find ALL that apply):
1. SPAM WORDS: urgent, free, guarantee, limited time, act now, click here, buy now, special offer, etc.
2. PERSONALIZATION: Generic greetings, placeholder text
3. CALL-TO-ACTION: Make specific and clear (change "let me know" to "reply with your availability")
4. SUBJECT LINE: Make compelling but professional (rewrite if needed)
5. TONE: Make warm but professional (rewrite sentences that are too formal/casual)
6. VALUE PROPOSITION: State clear, specific benefits (add/rewrite value statements)
7. FORMATTING: Add paragraph breaks, improve structure
8. GRAMMAR: Fix any issues

RULES FOR IMPROVEMENTS:
- REPLACE placeholders with actual user data from above:
  - [Your Name] → ${userProfile.name}
  - [Your Company] → ${userProfile.company}
  - [Your Position] → ${userProfile.role}
  - [Your Email] → ${userProfile.email}
  - [Your Phone Number] → ${userProfile.phone || '[Your Phone Number]'}
  - [Your LinkedIn Profile] → ${userProfile.linkedin || '[Your LinkedIn Profile]'}
  - [Your Website] → ${userProfile.website || '[Your Website]'}
- REWRITE everything else to be better
- Make the subject line MORE compelling
- Make the body MORE personable and valuable
- Add specific benefits and clarity
- Break into clear paragraphs
- Change vague phrases to specific ones

Example transformation:
BEFORE: "Would you be open to a brief call next week?"
AFTER: "Would you be available for a 15-minute call on Tuesday or Wednesday to discuss how we can help?"

Word count: ${wordCount} words

Return JSON with ALL issues AND the IMPROVED versions:
{
  "subject": "REWRITTEN subject line (must be different)",
  "body": "COMPLETELY REWRITTEN body with placeholders replaced and improvements made",
  "spam_words": ["word1", "word2"],
  "issues": [
    {"type": "issue_type", "severity": "high/medium/low", "description": "specific issue"}
  ],
  "changes_made": ["Replaced [Your Name] with ${userProfile.name}", "Changed X to Y", "Added Z"]
}

BE STRICT: Find 5-10 issues. ACTUALLY REWRITE THE EMAIL. REPLACE PLACEHOLDERS WITH REAL DATA.
    `;

    // -------------------------------
    // OPENAI CALL
    // -------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
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
    // CALCULATE SCORES PROGRAMMATICALLY
    // -------------------------------
    const calculateScore = (issues: any[], wordCount: number) => {
      let score = 100;
      
      if (!issues || !Array.isArray(issues)) return 100;
      
      // Issue-based penalties
      for (const issue of issues) {
        if (issue.severity === 'high') {
          score -= 12;
        } else if (issue.severity === 'medium') {
          score -= 7;
        } else if (issue.severity === 'low') {
          score -= 3;
        }
      }
      
      // Word count penalties (independent of GPT analysis)
      if (wordCount < 50) {
        score -= 8; // Too short
      } else if (wordCount < 75) {
        score -= 4; // A bit short
      } else if (wordCount > 250) {
        score -= 10; // Too long
      } else if (wordCount > 200) {
        score -= 5; // A bit long
      }
      
      return Math.max(0, Math.min(100, score));
    };

    const originalScore = calculateScore(json.issues || [], wordCount);
    
    // Improved score: assume most high/medium issues are fixed
    // Only apply low severity to remaining structural issues
    const structuralIssues = (json.issues || []).filter((issue: any) => 
      issue.type.includes('too_short') || 
      issue.type.includes('too_long') ||
      issue.type.includes('subject_too')
    );
    
    // Reduced word count penalty for improved version (assume slight optimization)
    const improvedWordCount = wordCount > 200 ? 190 : wordCount < 75 ? 85 : wordCount;
    const improvedScore = calculateScore(
      structuralIssues.map((i: any) => ({...i, severity: 'low'})), 
      improvedWordCount
    );

    // Add calculated scores to response
    const response = {
      ...json,
      original_score: originalScore,
      score: Math.min(100, improvedScore + 10), // Improved version gets bonus
      issues_found: (json.issues || []).map((i: any) => i.description)
    };

    // -------------------------------
    // SUCCESS
    // -------------------------------
    return NextResponse.json(response);
  } catch (e) {
    console.error("DELIVERABILITY ERROR:", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
