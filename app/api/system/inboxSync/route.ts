import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { ImapClient } from "@/lib/email/imapClient";
import { isReply } from "@/utils/detectReply";
import { simpleParser } from "mailparser";

// This route should be called by a Cron job (e.g., Vercel Cron) every 5 minutes
export async function GET(req: Request) {
    // Basic security check (e.g., CRON_SECRET)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Fetch workspaces with IMAP configured
        // Note: In a real app, we might want to paginate or distribute this work
        const workspacesSnapshot = await adminDB.collection("workspaces").get();
        const results = [];

        for (const doc of workspacesSnapshot.docs) {
            const workspaceId = doc.id;
            const workspaceData = doc.data();
            const userId = workspaceData.userId || workspaceData.ownerId; // specific to your schema

            if (!userId) continue;

            // 1a. Check Plan & Interval
            const { getUserPlan } = await import("@/lib/server/getUserPlan");
            const planData = await getUserPlan(userId);
            
            if (planData.planType === "free") {
                continue; // Inbox sync disabled for free plan
            }

            // Enforce sync intervals
            let intervalSeconds = 600; // Default Starter: 10 mins
            if (planData.planType === "pro") intervalSeconds = 300; // Pro: 5 mins
            if (planData.planType === "agency") intervalSeconds = 60; // Agency: 1 min

            // Override if plan data has specific setting, but respect minimums
            if (planData.planData.imapSyncIntervalSeconds) {
                intervalSeconds = Math.max(intervalSeconds, planData.planData.imapSyncIntervalSeconds);
            }

            const lastSynced = workspaceData.inboxLastSynced?.toDate() || new Date(0);
            const now = new Date();
            const secondsSinceSync = (now.getTime() - lastSynced.getTime()) / 1000;

            if (secondsSinceSync < intervalSeconds) {
                continue; // Too soon
            }

            // 1b. Charge Credits
            const { checkAndConsumeOperation } = await import("@/lib/server/checkAndConsumeOperation");
            try {
                await checkAndConsumeOperation(userId, "imapSync");
            } catch (e: any) {
                console.log(`[InboxSync] Skipping workspace ${workspaceId}: ${e.message}`);
                results.push({ workspaceId, error: e.message });
                continue;
            }

            const settingsDoc = await adminDB
                .collection("workspaces")
                .doc(workspaceId)
                .collection("settings")
                .doc("smtp")
                .get();

            const config = settingsDoc.data();

            if (!config || !config.imapHost || !config.imapUsername || !config.imapPassword) {
                continue; // Skip if not configured
            }

            try {
                // 2. Connect to IMAP
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

                // 3. Fetch new messages
                // Ideally, we track the last synced UID or date to fetch only new ones
                // For simplicity, we'll fetch the last 20 messages and check if they exist
                const messages = await client.listMessages("INBOX", 20);

                let syncedCount = 0;

                for (const msg of messages) {
                    if (!msg.source) continue;

                    // Parse email content
                    const parsed = await simpleParser(msg.source);
                    const messageId = parsed.messageId || `generated_${Date.now()}_${Math.random()}`;
                    
                    // Check if already exists
                    const existing = await adminDB
                        .collection("workspaces")
                        .doc(workspaceId)
                        .collection("inbox")
                        .doc(messageId) // Use messageId as doc ID if valid, else query
                        .get();

                    if (existing.exists) continue;

                    // 4. Resolve Lead
                    const fromEmail = parsed.from?.value[0]?.address || "";
                    let leadId = null;
                    let leadData = null;

                    if (fromEmail) {
                        const leadsQuery = await adminDB
                            .collection("workspaces")
                            .doc(workspaceId)
                            .collection("leads")
                            .where("email", "==", fromEmail)
                            .limit(1)
                            .get();

                        if (!leadsQuery.empty) {
                            leadId = leadsQuery.docs[0].id;
                            leadData = leadsQuery.docs[0].data();
                        }
                    }

                    // 5. Detect Reply & Threading
                    const isReplyMsg = isReply({
                        subject: parsed.subject || "",
                        inReplyTo: parsed.inReplyTo,
                        references: parsed.references,
                        from: { email: fromEmail, name: parsed.from?.value[0]?.name || "" }
                    }, leadData?.email);

                    // 6. Save to Inbox
                    await adminDB
                        .collection("workspaces")
                        .doc(workspaceId)
                        .collection("inbox")
                        .doc(messageId) // Sanitize if needed
                        .set({
                            messageId,
                            threadId: parsed.inReplyTo || null, // Basic threading
                            subject: parsed.subject || "(No Subject)",
                            from: {
                                name: parsed.from?.value[0]?.name || "",
                                email: fromEmail
                            },
                            to: Array.isArray(parsed.to) 
                                ? parsed.to.flatMap(t => t.value).map((t: any) => ({ name: t.name, email: t.address }))
                                : parsed.to?.value.map((t: any) => ({ name: t.name, email: t.address })) || [],
                            bodyHtml: parsed.html || "",
                            bodyText: parsed.text || "",
                            date: parsed.date || new Date(),
                            seen: false,
                            folder: "inbox",
                            leadId,
                            sequenceReply: isReplyMsg,
                            createdAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp()
                        });

                    syncedCount++;

                    // 7. Update Lead & Stop Sequence
                    if (leadId && isReplyMsg) {
                        // Update status
                        await adminDB
                            .collection("workspaces")
                            .doc(workspaceId)
                            .collection("leads")
                            .doc(leadId)
                            .update({
                                status: "replied",
                                lastReplyAt: FieldValue.serverTimestamp()
                            });

                        // Log event
                        await adminDB
                            .collection("workspaces")
                            .doc(workspaceId)
                            .collection("leads")
                            .doc(leadId)
                            .collection("timeline")
                            .add({
                                type: "email_reply",
                                text: `Reply received: ${parsed.subject}`,
                                metadata: { messageId },
                                createdAt: FieldValue.serverTimestamp()
                            });

                        // Stop active sequences
                        const activeSequencesQuery = await adminDB
                            .collection("workspaces")
                            .doc(workspaceId)
                            .collection("leads")
                            .doc(leadId)
                            .collection("active_sequences")
                            .where("status", "==", "active")
                            .get();

                        const batch = adminDB.batch();

                        activeSequencesQuery.docs.forEach((doc) => {
                            batch.update(doc.ref, {
                                status: "stopped",
                                stoppedAt: FieldValue.serverTimestamp(),
                                stopReason: "reply_received"
                            });
                        });

                        await batch.commit();

                        if (!activeSequencesQuery.empty) {
                             await adminDB
                                .collection("workspaces")
                                .doc(workspaceId)
                                .collection("leads")
                                .doc(leadId)
                                .collection("timeline")
                                .add({
                                    type: "sequence_stopped",
                                    text: "Sequence automatically stopped after reply",
                                    createdAt: FieldValue.serverTimestamp()
                                });
                        }
                    }
                }

                await client.disconnect();
                
                results.push({ workspaceId, synced: syncedCount });

                // Update last sync time
                await adminDB.collection("workspaces").doc(workspaceId).update({
                    inboxLastSynced: FieldValue.serverTimestamp()
                });

            } catch (err: any) {
                console.error(`[InboxSync] Error for workspace ${workspaceId}:`, err);
                results.push({ workspaceId, error: err.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("[InboxSync] Fatal error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
