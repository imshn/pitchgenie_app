import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { checkPlanLimit } from "@/app/api/utils/checkPlanLimit";

export async function POST(req: Request) {
  try {
    // ---------------------------
    // VERIFY AUTH & WORKSPACE
    // ---------------------------
    const { uid, workspaceId } = await verifyUser();

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    // ---------------------------
    // REQUEST BODY
    // ---------------------------
    const { title, subject, body, followUp } = await req.json();

    if (!title || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------------------
    // CHECK PLAN LIMITS
    // ---------------------------
    // We need to pass the current count. 
    // Ideally checkPlanLimit handles fetching, but it needs 'usedCount'.
    // Let's fetch the workspace to get the current count first.
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    const currentCount = workspaceDoc.data()?.templateCount || 0;

    const limitError = await checkPlanLimit({
      workspaceId,
      feature: "templates",
      usedCount: currentCount
    });

    if (limitError) return limitError;

    // ---------------------------
    // SAVE TEMPLATE TO FIRESTORE
    // ---------------------------
    // Save to workspace templates collection instead of user templates?
    // The prompt implies workspace limits, so we should probably save to workspace.
    // But the original code saved to `users/${uid}/templates`.
    // I will keep it as is but ALSO track it on the workspace.
    // Actually, for team workspaces, templates should probably be shared.
    // But to minimize breakage, I'll stick to the existing path but enforce workspace limits.
    
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("templates")
      .add({
        title,
        subject,
        body,
        followUp: followUp || "",
        createdAt: Date.now(),
        workspaceId // Link to workspace
      });

    // Increment workspace template count
    await adminDB.collection("workspaces").doc(workspaceId).update({
      templateCount: FieldValue.increment(1)
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("SAVE TEMPLATE ERROR:", e);
    return NextResponse.json(
      { error: "Server Error saving template" },
      { status: 500 }
    );
  }
}
