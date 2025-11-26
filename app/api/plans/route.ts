
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plansSnapshot = await adminDB.collection("plans").get();
    
    const plans: any[] = [];
    plansSnapshot.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() });
    });

    // Sort plans by price to ensure correct order (Free -> Starter -> Pro -> Agency)
    plans.sort((a, b) => a.priceMonthly - b.priceMonthly);

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
