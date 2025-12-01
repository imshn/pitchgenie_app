import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_NAME = "gpt-4o-mini";

export interface OpenAIRequestContext {
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
 * Generate email using OpenAI (GPT-4o-mini)
 */
export async function generateEmailWithOpenAI(
  context: OpenAIRequestContext,
  maxRetries: number = 2
): Promise<EmailGenerationResponse> {
  const systemPrompt = `You are a world-class B2B copywriter.
Write emails that get replies: hyper-personalized, concise, value-driven.

STRICT RULES:
1. NO generic fluff ("I hope this finds you well").
2. Start with a relevant observation/problem.
3. Focus on pain points & solution.
4. Professional yet conversational tone.
5. Body < 150 words.
6. Subject < 6 words, intriguing.
7. Low friction CTA.

IMPORTANT: Respond ONLY with valid JSON:
{
  "subject": "...",
  "body": "...",
  "followUp": "..."
}`;

  const userPrompt = `Write a cold email to this lead:

User Profile:
${JSON.stringify(context.userProfile, null, 2)}

Lead:
${JSON.stringify(context.lead, null, 2)}

${context.companySummary ? `Company Summary:
${JSON.stringify(context.companySummary, null, 2)}` : ""}

Persona: ${context.persona || "Founder"}

Instructions:
1. Find a specific hook.
2. Connect challenges to value prop.
3. Write high-converting email + follow-up.`;

  return await makeOpenAIRequest<EmailGenerationResponse>(
    systemPrompt,
    userPrompt,
    maxRetries
  );
}

/**
 * Generate sequence using OpenAI
 */
export async function generateSequenceWithOpenAI(
  context: OpenAIRequestContext,
  maxRetries: number = 2
): Promise<SequenceGenerationResponse> {
  const systemPrompt = `You are an expert B2B outreach writer.
Generate 3-5 emails with appropriate day intervals.
Respond ONLY with valid JSON:
{
  "sequence": [
    { "day": 0, "subject": "...", "body": "..." },
    { "day": 3, "subject": "...", "body": "..." }
  ]
}`;

  const userPrompt = `Generate sequence for:
User: ${JSON.stringify(context.userProfile, null, 2)}
Lead: ${JSON.stringify(context.lead, null, 2)}
${context.companySummary ? `Company: ${JSON.stringify(context.companySummary, null, 2)}` : ""}`;

  return await makeOpenAIRequest<SequenceGenerationResponse>(
    systemPrompt,
    userPrompt,
    maxRetries,
    2000
  );
}

/**
 * Generate LinkedIn message using OpenAI
 */
export async function generateLinkedInMessageWithOpenAI(
  context: OpenAIRequestContext,
  maxRetries: number = 2
): Promise<{ connectMessage: string; followUp: string }> {
  const systemPrompt = `Expert LinkedIn networker.
Messages under 300 chars.
Respond ONLY with valid JSON:
{
  "connectMessage": "...",
  "followUp": "..."
}`;

  const userPrompt = `Generate LinkedIn messages for:
User: ${JSON.stringify(context.userProfile, null, 2)}
Lead: ${JSON.stringify(context.lead, null, 2)}`;

  return await makeOpenAIRequest<{ connectMessage: string; followUp: string }>(
    systemPrompt,
    userPrompt,
    maxRetries,
    500
  );
}

/**
 * Summarize company using OpenAI
 */
export async function summarizeCompanyWithOpenAI(
  url: string,
  scrapedContent: string,
  mode: "light" | "deep",
  userProfile?: any,
  maxRetries: number = 2
): Promise<ScrapingSummaryResponse> {
  const systemPrompt = `Expert company analyst. Extract structured data.
Respond ONLY with valid JSON:
{
  "description": "Brief description",
  "founders": ["Name"],
  "services": ["Service"],
  "contactEmails": ["email"],
  "socialLinks": ["url"],
  "topPages": ["/path"]
}`;

  const wordLimit = mode === "light" ? 200 : 800;
  const userPrompt = `Analyze ${url}:
Content: ${scrapedContent.substring(0, 10000)}

${userProfile ? `Context: ${JSON.stringify(userProfile, null, 2)}` : ""}

Provide ${wordLimit}-word summary & extract key info.`;

  return await makeOpenAIRequest<ScrapingSummaryResponse>(
    systemPrompt,
    userPrompt,
    maxRetries,
    mode === "light" ? 500 : 1500
  );
}

/**
 * Check deliverability using OpenAI
 */
export async function checkDeliverabilityWithOpenAI(
  subject: string,
  body: string,
  userProfile: any,
  maxRetries: number = 2
): Promise<any> {
  const systemPrompt = `STRICT email deliverability analyzer.
Rewrite email to fix spam words, tone, personalization, clarity.
Replace placeholders with User Profile data.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Respond ONLY with valid JSON:
{
  "subject": "Rewritten subject",
  "body": "Rewritten body",
  "spam_words": ["word"],
  "issues": [{"type": "...", "severity": "high/medium/low", "description": "..."}],
  "changes_made": ["..."]
}`;

  const userPrompt = `Analyze & Improve:
Subject: ${subject}
Body: ${body}

BE STRICT. REWRITE WITH REAL DATA.`;

  return await makeOpenAIRequest<any>(systemPrompt, userPrompt, maxRetries);
}

/**
 * Analyze reply using OpenAI
 */
export async function analyzeReplyWithOpenAI(
  replyText: string,
  userProfile: any,
  maxRetries: number = 2
): Promise<any> {
  const systemPrompt = `Analyze cold email reply.
User Context: ${JSON.stringify(userProfile, null, 2)}

Respond ONLY with valid JSON:
{
  "sentiment": "interested|positive|neutral|negative|not_interested|pricing_question|more_info",
  "summary": "...",
  "reply": "Recommended response"
}`;

  const userPrompt = `Analyze: "${replyText}"`;

  return await makeOpenAIRequest<any>(systemPrompt, userPrompt, maxRetries);
}

// --- Helper ---

async function makeOpenAIRequest<T>(
  systemPrompt: string,
  userPrompt: string,
  maxRetries: number,
  maxTokens: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_NAME,
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content from OpenAI");

      return JSON.parse(content) as T;
    } catch (error: any) {
      lastError = error;
      console.error(`[OpenAI] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `OpenAI request failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}
