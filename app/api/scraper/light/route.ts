import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation, checkOperationLimits } from "@/lib/server/checkAndConsumeOperation";
import { scrapeLight } from "@/lib/scraper";
import { adminDB } from "@/lib/firebase-admin";
import { ScraperError } from "@/lib/scraper/core/errors";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Check Credits (Read-only check first? No, checkAndConsume does both. 
    // But we want to charge ONLY on success.
    // So we need a way to check limits without consuming.
    // checkOperationLimits is the function for that!)
    
    const { checkOperationLimits } = await import("@/lib/server/checkAndConsumeOperation");
    await checkOperationLimits(uid, "lightScrape");

    // 2. Run Scraper
    const result = await scrapeLight(url); // Modified scrapeLight call

    // 3. Save to History (Async)
    const historyItem = {
      url: result.url,
      title: result.title,
      favicon: result.favicon,
      timestamp: new Date().toISOString(),
      status: 'success',
      result: result, // Match the type definition
      data: result // Keep for backward compatibility
    };

    // Save history and get ID
    const historyRef = await adminDB.collection('users').doc(uid).collection('scrapes').add(historyItem);
    const historyId = historyRef.id;

    // 4. Charge Credits (Consume)
    // Only if successful
    await checkAndConsumeOperation(uid, "lightScrape", { url });

    return NextResponse.json({ ...result, historyId });

  } catch (error: any) {
    console.error("[Scraper API] Error:", error);

    if (error instanceof ScraperError) {
      return NextResponse.json({
        error: true,
        code: error.code,
        message: error.message,
        retryAttempts: error.retryAttempts
      }, { status: 422 }); // Unprocessable Entity for scraper errors
    }

    if (error.message?.includes("INSUFFICIENT_CREDITS") || error.message?.includes("SCRAPER_LIMIT_REACHED")) {
      return NextResponse.json({
        error: true,
        code: "LIMIT_REACHED",
        message: error.message
      }, { status: 402 });
    }

    return NextResponse.json({
      error: true,
      code: "INTERNAL_ERROR",
      message: "Failed to scrape URL"
    }, { status: 500 });
  }
}
