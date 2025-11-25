import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { uid, email: senderEmail } = await verifyUser();
    const { workspaceId, email } = await req.json();

    if (!workspaceId || !email) {
      return NextResponse.json({ error: "Workspace ID and email are required" }, { status: 400 });
    }

    // Verify workspace exists
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspaceData = workspaceDoc.data();
    
    // Verify requester is owner or admin
    const requester = workspaceData?.members.find((m: any) => m.uid === uid);
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already a member
    const isMember = workspaceData?.members.some((m: any) => m.email === email);
    if (isMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    // Check if already invited
    if (workspaceData?.invited?.includes(email)) {
      return NextResponse.json({ error: "User is already invited" }, { status: 400 });
    }

    // Add to invited list
    await workspaceRef.update({
      invited: FieldValue.arrayUnion(email)
    });

    // ------------------ SEND EMAIL ------------------
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?invite=${workspaceId}`; // Simple link for now

        await transporter.sendMail({
            from: `"${senderEmail}" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `You've been invited to join ${workspaceData?.name} on PitchGenie`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited!</h2>
                    <p><strong>${senderEmail}</strong> has invited you to join the workspace <strong>${workspaceData?.name}</strong> on PitchGenie.</p>
                    <p>Click the button below to accept the invitation:</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Accept Invitation</a>
                    <p style="margin-top: 24px; color: #666; font-size: 14px;">If you don't have an account, you'll be prompted to create one.</p>
                </div>
            `,
        });
    } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Continue execution, don't fail the request just because email failed
    }

    // ------------------ CREATE NOTIFICATION ------------------
    // Find user by email to get their UID for notification
    const userQuery = await adminDB.collection("users").where("email", "==", email).limit(1).get();
    
    if (!userQuery.empty) {
        const inviteeUid = userQuery.docs[0].id;
        await adminDB.collection("users").doc(inviteeUid).collection("notifications").add({
            type: "workspace_invite",
            workspaceId,
            workspaceName: workspaceData?.name,
            senderEmail,
            createdAt: Date.now(),
            read: false
        });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("INVITE MEMBER ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
