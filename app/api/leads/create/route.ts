import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";
import { getUserPlan } from "@/lib/server/getUserPlan";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const body = await req.json();
    const { email, firstName, lastName, company, website, linkedin, notes } = body;

    // Get workspace
    const planData = await getUserPlan(uid);
    const workspaceId = planData.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Create lead
    const leadRef = adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("leads")
      .doc();

    const leadData = {
      id: leadRef.id,
      email: email || null,
      firstName: firstName || "",
      lastName: lastName || "",
      company: company || "",
      website: website || "",
      linkedin: linkedin || "",
      notes: notes || "",
      status: "new",
      source: "scraper",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: uid
    };

    await leadRef.set(leadData);

    return NextResponse.json({ success: true, leadId: leadRef.id });
  } catch (error: any) {
    console.error("[Leads Create] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create lead" }, { status: 500 });
  }
}
