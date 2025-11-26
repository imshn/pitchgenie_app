import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { PlanDocument } from "@/lib/types/plans";

export async function GET() {
  try {
    const plansSnapshot = await adminDB
      .collection("plans")
      .where("id", "in", ["free", "starter", "pro", "agency"])
      .get();

    const plans: PlanDocument[] = [];

    plansSnapshot.forEach((doc) => {
      if (doc.id !== "addonCredits") {
        plans.push(doc.data() as PlanDocument);
      }
    });

    // Sort by monthly price
    plans.sort((a, b) => a.priceMonthly - b.priceMonthly);

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("[GET /api/plans] Error fetching plans:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
