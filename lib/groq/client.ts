import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use Llama 3.3 70B as the flagship model since Mixtral 8x7b is decommissioned
// and the user wants high quality (GPT-4o equivalent).
const MODEL_NAME = "llama-3.3-70b-versatile";

export interface GroqRequestContext {
  userProfile: any;
  lead: any;
  companySummary?: any;
  persona?: string;
}

export interface EmailGenerationResponse {
  subject: string;
  body: string;
  followUp: string;
}

export interface SequenceGenerationResponse {
  sequence: Array<{
    day: number;
    subject: string;
    body: string;
  }>;
}

export interface ScrapingSummaryResponse {
  description: string;
  founders: string[];
  services: string[];
  contactEmails: string[];
  socialLinks: string[];
  topPages: string[];
}

/**
 * Generate email using Groq AI
 * Uses Llama 3.3 70B (Mixtral decommissioned).
 * STRICT prompt for high quality.
 */
export async function generateEmailWithGroq(
  context: GroqRequestContext,
  maxRetries: number = 2
): Promise<EmailGenerationResponse> {
  const systemPrompt = `You are a world-class B2B copywriter specializing in cold outreach.
Your goal is to write emails that get replies by being hyper-personalized, concise, and value-driven.

STRICT RULES:
1. NO generic fluff like "I hope this email finds you well" or "I recently came across...".
2. Start directly with a relevant observation or problem.
3. Focus on the prospect's pain points and how the user's solution addresses them.
4. Keep the tone professional yet conversational (like a peer, not a salesperson).
5. Keep the body under 150 words.
6. Subject line must be under 6 words, lowercase is often better, and intriguing.
7. Call to action should be low friction (e.g., "Worth a chat?", "Open to a 5-min demo?").

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "subject": "Concise, intriguing subject line",
  "body": "The email body",
  "followUp": "A short follow-up email sent 3 days later"
}`;

  const userPrompt = `Write a cold email to this lead:

User Profile (Sender):
${JSON.stringify(context.userProfile, null, 2)}

Lead (Recipient):
${JSON.stringify(context.lead, null, 2)}

${context.companySummary ? `Company Summary (Lead's Company):
${JSON.stringify(context.companySummary, null, 2)}` : ""}

Persona: ${context.persona || "Founder"}

Instructions:
1. Analyze the lead's role and company to find a specific hook.
2. Connect their likely challenges to the sender's value proposition.
3. Write a high-converting cold email and a follow-up.`;

  let lastError: Error | null = null;
  let temperature = 0.7;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: temperature,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Groq response");
      }

      const parsed = JSON.parse(content);

      if (!parsed.subject || !parsed.body || !parsed.followUp) {
        throw new Error("Invalid response structure from Groq");
      }

      return parsed as EmailGenerationResponse;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);
      temperature = Math.max(0.3, temperature - 0.2);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq email generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Generate email sequence using Groq AI
 */
export async function generateSequenceWithGroq(
  context: GroqRequestContext,
  maxRetries: number = 2
): Promise<SequenceGenerationResponse> {
  const systemPrompt = `You are an expert B2B outreach writer. Create email sequences for follow-ups.
Generate 3-5 emails with appropriate day intervals.
IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "sequence": [
    { "day": 0, "subject": "...", "body": "..." },
    { "day": 3, "subject": "...", "body": "..." },
    { "day": 7, "subject": "...", "body": "..." }
  ]
}`;

  const userPrompt = `Generate an email sequence based on the following context:

User Profile: ${JSON.stringify(context.userProfile, null, 2)}
Lead: ${JSON.stringify(context.lead, null, 2)}
${context.companySummary ? `Company Summary: ${JSON.stringify(context.companySummary, null, 2)}` : ""}

Generate a 3-5 email sequence with appropriate timing.`;

  let lastError: Error | null = null;
  let temperature = 0.7;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: temperature,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content in Groq response");

      const parsed = JSON.parse(content);
      if (!parsed.sequence || !Array.isArray(parsed.sequence)) {
        throw new Error("Invalid sequence structure from Groq");
      }

      return parsed as SequenceGenerationResponse;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);
      temperature = Math.max(0.3, temperature - 0.2);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq sequence generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Generate company summary from scraped data using Groq AI
 */
export async function summarizeCompanyWithGroq(
  url: string,
  scrapedContent: string,
  mode: "light" | "deep",
  userProfile?: any, // Added optional user profile context
  maxRetries: number = 2
): Promise<ScrapingSummaryResponse> {
  const systemPrompt = `You are an expert at analyzing company websites and extracting key information.
Extract structured data from the provided website content.
IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "description": "Brief company description",
  "founders": ["Founder names if found"],
  "services": ["Service 1", "Service 2"],
  "contactEmails": ["email@example.com"],
  "socialLinks": ["https://..."],
  "topPages": ["/about", "/products"]
}`;

  const wordLimit = mode === "light" ? 200 : 800;
  const userPrompt = `Analyze this company website and extract key information:

URL: ${url}
Content: ${scrapedContent.substring(0, 5000)}

${userProfile ? `Context (User Profile): ${JSON.stringify(userProfile, null, 2)}
(Use this context to highlight relevant services or synergies if applicable)` : ""}

Provide a ${wordLimit}-word summary and extract founders, services, contact info, social links, and important pages.`;

  let lastError: Error | null = null;
  let temperature = 0.5;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: temperature,
        max_tokens: mode === "light" ? 500 : 1500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content in Groq response");

      const parsed = JSON.parse(content);
      if (!parsed.description) throw new Error("Invalid summary structure from Groq");

      return {
        description: parsed.description || "",
        founders: parsed.founders || [],
        services: parsed.services || [],
        contactEmails: parsed.contactEmails || [],
        socialLinks: parsed.socialLinks || [],
        topPages: parsed.topPages || [],
      };
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);
      temperature = Math.max(0.3, temperature - 0.1);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq summarization failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Generate LinkedIn connection message using Groq AI
 */
export async function generateLinkedInMessageWithGroq(
  context: GroqRequestContext,
  maxRetries: number = 2
): Promise<{ connectMessage: string; followUp: string }> {
  const systemPrompt = `You are an expert at writing LinkedIn connection messages.
Keep messages under 300 characters (LinkedIn limit).
IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "connectMessage": "Short connection request message",
  "followUp": "Follow-up message after connection"
}`;

  const userPrompt = `Generate LinkedIn messages based on:

User Profile: ${JSON.stringify(context.userProfile, null, 2)}
Lead: ${JSON.stringify(context.lead, null, 2)}

Generate a connection request and follow-up message.`;

  let lastError: Error | null = null;
  let temperature = 0.7;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: temperature,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content in Groq response");

      const parsed = JSON.parse(content);
      if (!parsed.connectMessage || !parsed.followUp) {
        throw new Error("Invalid LinkedIn message structure from Groq");
      }

      return parsed;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);
      temperature = Math.max(0.3, temperature - 0.2);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq LinkedIn generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Check email deliverability using Groq AI
 * Replaces OpenAI implementation.
 */
export async function checkDeliverabilityWithGroq(
  subject: string,
  body: string,
  userProfile: any,
  maxRetries: number = 2
): Promise<any> {
  const wordCount = body.trim().split(/\s+/).length;

  const systemPrompt = `You are a STRICT email deliverability analyzer. Find EVERY issue AND ACTUALLY FIX THEM.
CRITICAL: You MUST rewrite the email with REAL improvements. Don't just list issues - ACTUALLY CHANGE THE TEXT.

USER PROFILE DATA (use this to replace placeholders):
${JSON.stringify(userProfile, null, 2)}

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
- REPLACE placeholders with actual user data from above.
- REWRITE everything else to be better.
- Make the subject line MORE compelling.
- Make the body MORE personable and valuable.
- Add specific benefits and clarity.
- Break into clear paragraphs.
- Change vague phrases to specific ones.

Return JSON with ALL issues AND the IMPROVED versions:
{
  "subject": "REWRITTEN subject line (must be different)",
  "body": "COMPLETELY REWRITTEN body with placeholders replaced and improvements made",
  "spam_words": ["word1", "word2"],
  "issues": [
    {"type": "issue_type", "severity": "high/medium/low", "description": "specific issue"}
  ],
  "changes_made": ["Replaced [Your Name] with Name", "Changed X to Y", "Added Z"]
}`;

  const userPrompt = `ANALYZE AND IMPROVE THIS EMAIL:

Subject: ${subject}
Body: ${body}

Word count: ${wordCount} words

BE STRICT: Find 5-10 issues. ACTUALLY REWRITE THE EMAIL. REPLACE PLACEHOLDERS WITH REAL DATA.`;

  let lastError: Error | null = null;
  let temperature = 0; // Strict analysis

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: temperature,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content in Groq response");

      const parsed = JSON.parse(content);
      return parsed;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq deliverability check failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Analyze reply using Groq AI
 * Replaces OpenAI implementation.
 */
export async function analyzeReplyWithGroq(
  replyText: string,
  userProfile: any,
  maxRetries: number = 2
): Promise<any> {
  const systemPrompt = `You analyze cold email replies.
Return STRICT JSON ONLY, no commentary.

User Context:
${JSON.stringify(userProfile, null, 2)}

Return JSON:
{
  "sentiment": "interested | positive | neutral | negative | not_interested | pricing_question | more_info",
  "summary": "summary of what they said",
  "reply": "recommended AI reply text (personalized based on user context)"
}`;

  const userPrompt = `Analyze this reply:
"${replyText}"`;

  let lastError: Error | null = null;
  let temperature = 0.2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: temperature,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content in Groq response");

      const parsed = JSON.parse(content);
      return parsed;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq reply analysis failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}
