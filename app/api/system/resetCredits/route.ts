import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 60; // Allow longer execution for cron

export async function GET(req: Request) {
  try {
    // 1. Verify Cron Secret (Security)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // 2. Query workspaces due for reset
    // "nextReset" should be a timestamp. If missing, we might want to set it.
    // We look for workspaces where nextReset <= now
    const snapshot = await adminDB
      .collection("workspaces")
      .where("nextReset", "<=", now)
      .limit(500) // Process in batches to avoid timeouts
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, processed: 0, message: "No workspaces due for reset" });
    }

    // 3. Fetch all plans to know credit limits
    const plansSnapshot = await adminDB.collection("plans").get();
    const plansMap: Record<string, any> = {};
    plansSnapshot.forEach(doc => {
      plansMap[doc.id] = doc.data();
    });

    // Default free plan fallback
    const defaultFreePlan = { creditLimit: 50 };

    // 4. Batch Update
    const batch = adminDB.batch();
    let processedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const planId = data.planId || "free";
      const plan = plansMap[planId] || defaultFreePlan;
      
      // Reset logic
      const updateData = {
        credits: plan.creditLimit,
        scraperUsed: 0,
        sequenceUsed: 0,
        toneUsed: 0,
        nextReset: (data.nextReset || now) + thirtyDays, // Schedule next reset
        lastResetAt: now
      };

      batch.update(doc.ref, updateData);
      processedCount++;
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      message: `Reset credits for ${processedCount} workspaces` 
    });

  } catch (error: any) {
    console.error("CRON RESET ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
