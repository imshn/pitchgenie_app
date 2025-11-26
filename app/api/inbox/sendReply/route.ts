import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import nodemailer from "nodemailer";
import { ImapClient } from "@/lib/email/imapClient";

export async function POST(req: Request) {
    try {
        const { uid, workspaceId } = await verifyUser();
        const { to, subject, body, threadId, originalMessageId } = await req.json();

        if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

        // 1. Load SMTP Settings
        const settingsDoc = await adminDB
            .collection("workspaces")
            .doc(workspaceId)
            .collection("settings")
            .doc("smtp")
            .get();

        const config = settingsDoc.data();
        if (!config) return NextResponse.json({ error: "SMTP not configured" }, { status: 400 });

        // 2. Send via SMTP
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: config.encryption === "ssl",
            auth: {
                user: config.username,
                pass: config.password,
            },
        });

        const info = await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to,
            subject, // Should ideally be "Re: " + original subject if not present
            html: body,
            inReplyTo: originalMessageId, // Important for threading
            references: originalMessageId // Important for threading
        });

        // 3. Append to IMAP Sent Folder (Optional but good for sync)
        if (config.imapHost) {
            try {
                const client = new ImapClient({
                    host: config.imapHost,
                    port: parseInt(config.imapPort || "993"),
                    secure: config.imapEncryption === "ssl",
                    auth: {
                        user: config.imapUsername,
                        pass: config.imapPassword,
                    },
                });
                await client.connect();
                // Note: imapflow append is more complex, often requires raw message. 
                // For MVP, we might skip appending or use a library that generates raw mime.
                // We'll skip appending to IMAP "Sent" for now to save complexity, 
                // relying on the fact that we store it in Firestore "Sent" folder.
                await client.disconnect();
            } catch (e) {
                console.warn("Failed to append to IMAP Sent folder", e);
            }
        }

        // 4. Save to Firestore Inbox (Sent folder)
        const messageId = info.messageId.replace(/[<>]/g, ""); // Clean ID
        
        await adminDB
            .collection("workspaces")
            .doc(workspaceId)
            .collection("inbox")
            .doc(messageId)
            .set({
                messageId,
                threadId: threadId || null,
                subject,
                from: { name: config.fromName, email: config.fromEmail },
                to: [{ email: to, name: "" }], // Simple for now
                bodyHtml: body,
                bodyText: body.replace(/<[^>]*>?/gm, ""), // Simple strip tags
                date: new Date(),
                seen: true,
                folder: "sent",
                leadId: null, // Could resolve if needed
                sequenceReply: false,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });

        return NextResponse.json({ success: true, messageId });

    } catch (error: any) {
        console.error("SEND REPLY ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
