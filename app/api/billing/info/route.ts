// app/api/billing/info/route.ts
import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { uid } = await verifyUser();

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Get workspace data
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    const workspaceData = workspaceDoc.data();

    if (!workspaceData) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({
      planId: workspaceData.planId || "free",
      credits: workspaceData.credits ?? 50,
      workspaceName: workspaceData.workspaceName || "My Workspace",
      pendingSubscriptionId: workspaceData.pendingSubscriptionId || null,
      razorpaySubscriptionId: workspaceData.razorpaySubscriptionId || null,
    });
  } catch (err) {
    console.error("BILLING INFO ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
