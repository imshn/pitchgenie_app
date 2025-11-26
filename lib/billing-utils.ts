import { adminDB } from "./firebase-admin";
import { PlanId } from "@/types/billing";
import { calculateProRataCredits } from "./pro-rata";

// Map Razorpay plan IDs to our plan names
export function mapPlanIdToPlanName(planId: string): PlanId | null {
  const planMapping: Record<string, PlanId> = {
    [process.env.RAZORPAY_PLAN_STARTER || ""]: "starter",
    [process.env.RAZORPAY_PLAN_PRO || ""]: "pro",
    [process.env.RAZORPAY_PLAN_AGENCY || ""]: "agency",
  };
  
  return planMapping[planId] || null;
}

/**
 * Assign a plan to a workspace and update credits (with pro-rata calculation)
 * Called by webhook and admin routes
 */
export async function assignPlanToWorkspace(
  workspaceId: string,
  planId: PlanId,
  subscriptionId?: string,
  useProRata: boolean = true
): Promise<void> {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Fetch plan metadata from /plans collection
  const planDoc = await adminDB.collection("plans").doc(planId).get();
  
  if (!planDoc.exists) {
    throw new Error(`Plan ${planId} not found in /plans collection`);
  }

  const plan = planDoc.data()!;

  // Get current workspace data for pro-rata calculation
  const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
  const workspaceData = workspaceDoc.data();
  const currentPlanId = workspaceData?.planId || "free";
  const currentCredits = workspaceData?.credits || 0;
  const nextReset = workspaceData?.nextReset || (now + thirtyDays);

  // Calculate credits based on pro-rata or full allocation
  let creditsToAssign = plan.creditLimit;
  
  if (useProRata && currentPlanId !== planId && subscriptionId) {
    // This is an upgrade/change - use pro-rata
    const proRataCredits = calculateProRataCredits(currentPlanId, planId, nextReset);
    
    // Add pro-rata credits to existing balance (generous approach)
    creditsToAssign = currentCredits + proRataCredits;
    
    console.log(`[Billing] Pro-rata upgrade: ${currentCredits} + ${proRataCredits} = ${creditsToAssign}`);
  }

  const updateData: any = {
    planId,
    planRef: `/plans/${planId}`,
    credits: creditsToAssign,
    
    // Copy limits from plan
    scraperLimit: plan.scraperLimit,
    sequenceLimit: plan.sequenceLimit,
    templateLimit: plan.templateLimit,
    memberLimit: plan.memberLimit,
    toneLimit: plan.toneLimit,

    scraperUsed: 0,
    sequenceUsed: 0,
    toneUsed: 0,
    nextReset: workspaceData?.nextReset || (now + thirtyDays), // Keep existing reset date for upgrades
    updatedAt: now,
  };

  if (subscriptionId) {
    updateData.razorpaySubscriptionId = subscriptionId;
    updateData.pendingSubscriptionId = null;
    updateData.activatedAt = now;
  }

  await adminDB.collection("workspaces").doc(workspaceId).update(updateData);

  // Sync plan type to owner's user doc
  if (workspaceData?.ownerUid) {
      await adminDB.collection("users").doc(workspaceData.ownerUid).update({
          plan: planId,
          updatedAt: now
      });
  }

  // Log analytics event
  await adminDB
    .collection("workspaces")
    .doc(workspaceId)
    .collection("events")
    .add({
      type: "plan_assigned",
      planId,
      previousPlan: currentPlanId,
      subscriptionId: subscriptionId || null,
      creditsAssigned: creditsToAssign,
      proRataUsed: useProRata,
      timestamp: now,
    });

  console.log(`[Billing] Assigned ${planId} plan to workspace ${workspaceId}`);
}


/**
 * Create or get existing Razorpay customer for a user
 */
export async function getOrCreateRazorpayCustomer(
  razorpay: any,
  uid: string,
  email: string,
  name?: string
): Promise<string> {
  const userRef = adminDB.collection("users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  // Return existing customer ID if available
  if (userData?.razorpayCustomerId) {
    return userData.razorpayCustomerId;
  }

  // Create new customer
  const customer = await razorpay.customers.create({
    name: name || email.split("@")[0],
    email,
    fail_existing: "0", // Don't fail if customer with email already exists
  });

  // Save customer ID
  await userRef.update({
    razorpayCustomerId: customer.id,
    updatedAt: Date.now(),
  });

  console.log(`[Billing] Created Razorpay customer ${customer.id} for user ${uid}`);
  return customer.id;
}

/**
 * Find user by Razorpay subscription ID or customer ID
 */
export async function findUserByRazorpayId(
  field: "razorpaySubscriptionId" | "pendingSubscriptionId" | "razorpayCustomerId",
  value: string
): Promise<string | null> {
  const snapshot = await adminDB
    .collection("users")
    .where(field, "==", value)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

/**
 * Cancel workspace subscription (set to free plan)
 */
export async function cancelWorkspaceSubscription(workspaceId: string): Promise<void> {
  const now = Date.now();
  
  // Fetch free plan metadata
  const freePlanDoc = await adminDB.collection("plans").doc("free").get();
  
  if (!freePlanDoc.exists) {
    throw new Error("Free plan not found");
  }

  const freePlan = freePlanDoc.data()!;

  // Fetch workspace to get owner
  const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
  const workspaceData = workspaceDoc.data();

  await adminDB.collection("workspaces").doc(workspaceId).update({
    planId: "free",
    planRef: "/plans/free",
    credits: freePlan.creditLimit,
    
    // Reset limits to free plan
    scraperLimit: freePlan.scraperLimit,
    sequenceLimit: freePlan.sequenceLimit,
    templateLimit: freePlan.templateLimit,
    memberLimit: freePlan.memberLimit,
    toneLimit: freePlan.toneLimit,

    scraperUsed: 0,
    sequenceUsed: 0,
    toneUsed: 0,
    canceledAt: now,
    updatedAt: now,
  });

  // Sync plan type to owner's user doc
  if (workspaceData?.ownerUid) {
      await adminDB.collection("users").doc(workspaceData.ownerUid).update({
          plan: "free",
          updatedAt: now
      });
  }

  // Log cancellation event
  await adminDB
    .collection("workspaces")
    .doc(workspaceId)
    .collection("events")
    .add({
      type: "subscription_cancelled",
      timestamp: now,
    });

  console.log(`[Billing] Cancelled subscription for workspace ${workspaceId}`);
}
