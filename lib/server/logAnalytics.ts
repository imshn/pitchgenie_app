import { adminDB } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type AnalyticsEventType = 
  | "email_generated"
  | "email_sent"
  | "sequence_generated"
  | "scraper_run"
  | "credits_used"
  | "deliverability_check"
  | "email_opened"
  | "email_replied";

export async function logAnalyticsEvent(
  workspaceId: string,
  type: AnalyticsEventType,
  cost: number,
  meta: Record<string, any> = {}
) {
  if (!workspaceId) return;

  const batch = adminDB.batch();
  const now = Date.now();

  // 1. Log Event
  const eventRef = adminDB
    .collection("workspaces")
    .doc(workspaceId)
    .collection("events")
    .doc();

  batch.set(eventRef, {
    type,
    cost,
    timestamp: now,
    ...meta,
  });

  // 2. Update Summary
  const summaryRef = adminDB
    .collection("workspaces")
    .doc(workspaceId)
    .collection("analytics")
    .doc("summary");

  const increment = FieldValue.increment(1);
  const costIncrement = FieldValue.increment(cost);

  const updates: any = {
    updatedAt: now,
    credits_used_total: costIncrement,
  };

  if (type === "email_generated") updates.emails_generated_total = increment;
  if (type === "email_sent") updates.emails_sent_total = increment;
  if (type === "sequence_generated") updates.sequences_generated_total = increment;
  if (type === "scraper_run") updates.scrapes_total = increment;
  if (type === "deliverability_check") updates.deliverability_checks_total = increment;
  if (type === "email_opened") updates.emails_opened_total = increment;
  if (type === "email_replied") updates.emails_replied_total = increment;

  batch.set(summaryRef, updates, { merge: true });

  await batch.commit();
}
