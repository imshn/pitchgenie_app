import { adminDB } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type EventType = 
  | "email_generated"
  | "email_sent"
  | "sequence_generated"
  | "scraper_run"
  | "lead_imported"
  | "credits_deducted";

export interface EventData {
  type: EventType;
  leadId?: string | null;
  cost?: number | null;
  meta?: Record<string, any>;
  workspaceId?: string;
}

export async function logEvent(uid: string, data: EventData) {
  try {
    const workspaceId = data.workspaceId;
    
    // Determine where to log: Workspace or User
    // If workspaceId is present, log to workspace. Otherwise fallback to user.
    const parentRef = workspaceId 
      ? adminDB.collection("workspaces").doc(workspaceId)
      : adminDB.collection("users").doc(uid);

    const eventRef = parentRef.collection("events").doc();
    const summaryRef = parentRef.collection("analytics").doc("summary");

    const timestamp = Date.now();
    const eventDoc = {
      ...data,
      uid, // Keep track of who performed the action
      timestamp,
    };

    await adminDB.runTransaction(async (t) => {
      // 1. Read the summary document FIRST (Reads must come before writes)
      const summarySnap = await t.get(summaryRef);

      // 2. Create the event document
      t.set(eventRef, eventDoc);
      
      // 3. Update the summary document
      if (!summarySnap.exists) {
        t.set(summaryRef, {
          leads_total: data.type === "lead_imported" ? (data.meta?.count || 0) : 0,
          emails_generated_total: data.type === "email_generated" ? 1 : 0,
          sequences_generated_total: data.type === "sequence_generated" ? 1 : 0,
          scrapes_total: data.type === "scraper_run" ? 1 : 0,
          emails_sent_total: data.type === "email_sent" ? 1 : 0,
          credits_used_total: data.cost || 0,
          updatedAt: timestamp,
        });
      } else {
        const updates: any = {
          updatedAt: timestamp,
        };

        if (data.type === "lead_imported") {
          updates.leads_total = FieldValue.increment(data.meta?.count || 0);
        }
        if (data.type === "email_generated") {
          updates.emails_generated_total = FieldValue.increment(1);
        }
        if (data.type === "sequence_generated") {
          updates.sequences_generated_total = FieldValue.increment(1);
        }
        if (data.type === "scraper_run") {
          updates.scrapes_total = FieldValue.increment(1);
        }
        if (data.type === "email_sent") {
          updates.emails_sent_total = FieldValue.increment(1);
        }
        if (data.cost) {
          updates.credits_used_total = FieldValue.increment(data.cost);
        }

        t.update(summaryRef, updates);
      }
    });

    console.log(`[Analytics] Event logged: ${data.type} for ${workspaceId ? `workspace ${workspaceId}` : `user ${uid}`}`);
  } catch (error) {
    console.error("[Analytics] Failed to log event:", error);
    // Don't throw, we don't want to block the main flow
  }
}
