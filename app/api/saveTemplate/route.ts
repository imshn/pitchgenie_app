import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation } from "@/lib/server/checkAndConsumeOperation";

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
    // CHECK PLAN LIMITS & CONSUME
    // ---------------------------
    // This will check limits and increment usage atomically
    await checkAndConsumeOperation(uid, "templateSave");

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
