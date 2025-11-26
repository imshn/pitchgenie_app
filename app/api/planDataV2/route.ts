import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { getUserPlan } from "@/lib/server/getUserPlan";

export async function GET() {
  try {
    const { uid } = await verifyUser();

    const planData = await getUserPlan(uid);

    return NextResponse.json(planData);
  } catch (error: any) {
    console.error("[GET /api/planDataV2] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plan data" },
      { status: 500 }
    );
  }
}
