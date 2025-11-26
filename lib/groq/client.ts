import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
 */
export async function generateEmailWithGroq(
  context: GroqRequestContext,
  maxRetries: number = 2
): Promise<EmailGenerationResponse> {
  const systemPrompt = `You are an expert B2B outreach writer. Use the user's profile data to personalize emails. 
Prefer concise subject lines, short first emails, and 3 follow-ups. 
Mention company facts when available. Use friendly, professional tone.
IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "subject": "...",
  "body": "...",
  "followUp": "..."
}`;

  const userPrompt = `Generate a personalized outreach email based on the following context:

User Profile: ${JSON.stringify(context.userProfile, null, 2)}
Lead: ${JSON.stringify(context.lead, null, 2)}
${context.companySummary ? `Company Summary: ${JSON.stringify(context.companySummary, null, 2)}` : ""}
Persona: ${context.persona || "Founder"}

Generate a compelling outreach email with subject, body, and follow-up.`;

  let lastError: Error | null = null;
  let temperature = 0.7;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: temperature,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Groq response");
      }

      // Try to parse JSON
      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.subject || !parsed.body || !parsed.followUp) {
        throw new Error("Invalid response structure from Groq");
      }

      return parsed as EmailGenerationResponse;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);

      // Reduce temperature for retry
      temperature = Math.max(0.3, temperature - 0.2);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
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
        model: "llama-3.3-70b-versatile",
        temperature: temperature,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Groq response");
      }

      // Try to parse JSON
      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.sequence || !Array.isArray(parsed.sequence)) {
        throw new Error("Invalid sequence structure from Groq");
      }

      return parsed as SequenceGenerationResponse;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);

      // Reduce temperature for retry
      temperature = Math.max(0.3, temperature - 0.2);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
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
        model: "llama-3.3-70b-versatile",
        temperature: temperature,
        max_tokens: mode === "light" ? 500 : 1500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Groq response");
      }

      // Try to parse JSON
      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.description) {
        throw new Error("Invalid summary structure from Groq");
      }

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

      // Reduce temperature for retry
      temperature = Math.max(0.3, temperature - 0.1);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
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
        model: "llama-3.3-70b-versatile",
        temperature: temperature,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Groq response");
      }

      // Try to parse JSON
      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.connectMessage || !parsed.followUp) {
        throw new Error("Invalid LinkedIn message structure from Groq");
      }

      return parsed;
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq] Attempt ${attempt + 1} failed:`, error.message);

      // Reduce temperature for retry
      temperature = Math.max(0.3, temperature - 0.2);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Groq LinkedIn generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}
