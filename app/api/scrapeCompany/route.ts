import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation } from "@/lib/server/checkAndConsumeOperation";
import { summarizeCompanyWithGroq } from "@/lib/groq/client";
import { adminDB } from "@/lib/firebase-admin";

/**
 * Simple web scraper using fetch
 * In production, consider using a proper scraping service
 */
async function scrapeWebsite(url: string, mode: "light" | "deep"): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mode === "light" ? 5000 : 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PitchGenie/1.0; +https://pitchgenie.ai)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text content (simple approach - in production use a proper HTML parser)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limit content length based on mode
    const maxLength = mode === "light" ? 2000 : 10000;
    return textContent.substring(0, maxLength);
  } catch (error: any) {
    console.error(`[scrapeWebsite] Error scraping ${url}:`, error.message);
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { url, mode, leadId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    if (!mode || !["light", "deep"].includes(mode)) {
      return NextResponse.json(
        { error: 'mode must be "light" or "deep"' },
        { status: 400 }
      );
    }

    // Check and consume credits based on mode
    const operation = mode === "light" ? "lightScrape" : "deepScrape";
    await checkAndConsumeOperation(uid, operation);

    // Scrape the website
    console.log(`[POST /api/scrapeCompany] Scraping ${url} in ${mode} mode`);
    const scrapedContent = await scrapeWebsite(url, mode);

    // Summarize using Groq AI
    const summary = await summarizeCompanyWithGroq(url, scrapedContent, mode);

    // Save to lead document if leadId provided
    if (leadId) {
      await adminDB
        .collection("leads")
        .doc(leadId)
        .update({
          aiSummary: {
            description: summary.description,
            founders: summary.founders,
            services: summary.services,
            contactEmails: summary.contactEmails,
            socialLinks: summary.socialLinks,
            topPages: summary.topPages,
            scrapedAt: new Date().toISOString(),
            scrapeMode: mode,
            sourceUrl: url,
          },
          updatedAt: new Date().toISOString(),
        });
    }

    // Cache summary in /companies collection
    const domain = new URL(url).hostname;
    await adminDB
      .collection("companies")
      .doc(domain)
      .set(
        {
          domain,
          url,
          summary,
          lastScraped: new Date().toISOString(),
          scrapeMode: mode,
        },
        { merge: true }
      );

    console.log(`[POST /api/scrapeCompany] Successfully scraped and summarized ${url}`);

    return NextResponse.json({
      summary,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[POST /api/scrapeCompany] Error:", error);

    // Check for specific error codes
    if (error.message?.includes("INSUFFICIENT_CREDITS")) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    if (error.message?.includes("SCRAPER_LIMIT_REACHED")) {
      return NextResponse.json(
        { error: "Scraper limit reached for your plan" },
        { status: 403 }
      );
    }

    if (error.message?.includes("DEEP_SCRAPER_NOT_ALLOWED")) {
      return NextResponse.json(
        { error: "Deep scraper not available on your plan" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to scrape company" },
      { status: 500 }
    );
  }
}
