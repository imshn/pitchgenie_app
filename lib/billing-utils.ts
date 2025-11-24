import { adminDB } from "./firebase-admin";
import { PLAN_CONFIGS } from "./credit-types";
import type { PlanType } from "./credit-types";
import { calculateProRataCredits } from "./pro-rata";

// Map Razorpay plan IDs to our plan names
export function mapPlanIdToPlanName(planId: string): PlanType | null {
  const planMapping: Record<string, PlanType> = {
    [process.env.RAZORPAY_PLAN_STARTER || ""]: "starter",
    [process.env.RAZORPAY_PLAN_PRO || ""]: "pro",
    [process.env.RAZORPAY_PLAN_AGENCY || ""]: "agency",
  };
  
  return planMapping[planId] || null;
}

/**
 * Assign a plan to a user and update credits (with pro-rata calculation)
 * Called by webhook and admin routes
 */
export async function assignPlanToUser(
  uid: string,
  plan: PlanType,
  subscriptionId?: string,
  useProRata: boolean = true
): Promise<void> {
  const planConfig = PLAN_CONFIGS[plan];
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // Get current user data for pro-rata calculation
  const userDoc = await adminDB.collection("users").doc(uid).get();
  const userData = userDoc.data();
  const currentPlan = userData?.plan || "free";
  const currentCredits = userData?.credits || 0;
  const nextReset = userData?.nextReset || (now + thirtyDays);

  // Calculate credits based on pro-rata or full allocation
  let creditsToAssign = planConfig.credits;
  
  if (useProRata && currentPlan !== plan && subscriptionId) {
    // This is an upgrade/change - use pro-rata
    const proRataCredits = calculateProRataCredits(currentPlan, plan, nextReset);
    
    // Add pro-rata credits to existing balance (generous approach)
    creditsToAssign = currentCredits + proRataCredits;
    
    console.log(`[Billing] Pro-rata upgrade: ${currentCredits} + ${proRataCredits} = ${creditsToAssign}`);
  }

  const updateData: any = {
    plan,
    credits: creditsToAssign,
    maxCredits: planConfig.maxCredits,
    monthlyCredits: planConfig.monthlyCredits,
    scraperLimit: planConfig.scraperLimit,
    scraperUsed: 0,
    isUnlimited: plan === "agency",
    nextReset: userData?.nextReset || (now + thirtyDays), // Keep existing reset date for upgrades
    planUpdatedAt: now,
    updatedAt: now,
  };

  if (subscriptionId) {
    updateData.razorpaySubscriptionId = subscriptionId;
    updateData.pendingSubscriptionId = null;
    updateData.activatedAt = now;
  }

  await adminDB.collection("users").doc(uid).update(updateData);

  // Log analytics event
  await adminDB
    .collection("users")
    .doc(uid)
    .collection("events")
    .add({
      type: "plan_assigned",
      plan,
      previousPlan: currentPlan,
      subscriptionId: subscriptionId || null,
      creditsAssigned: creditsToAssign,
      proRataUsed: useProRata,
      timestamp: now,
    });

  console.log(`[Billing] Assigned ${plan} plan to user ${uid}`);
}

/**
 * Reset monthly credits if the reset date has passed
 * Called lazily when user performs actions
 */
export async function resetMonthlyCreditsIfNeeded(uid: string): Promise<void> {
  const userRef = adminDB.collection("users").doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error("User not found");
  }
  
  const userData = userDoc.data();
  const now = Date.now();
  
  // Check if reset is needed
  if (userData?.nextReset && userData.nextReset < now) {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    await userRef.update({
      credits: userData.maxCredits || userData.monthlyCredits || 50,
      scraperUsed: 0,
      nextReset: now + thirtyDays,
      updatedAt: now,
    });
    
    console.log(`[Billing] Monthly credits reset for user ${uid}`);
  }
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
 * Cancel user subscription (set to free plan)
 */
export async function cancelUserSubscription(uid: string): Promise<void> {
  const now = Date.now();
  const freePlan = PLAN_CONFIGS.free;

  await adminDB.collection("users").doc(uid).update({
    plan: "free",
    credits: freePlan.credits,
    maxCredits: freePlan.maxCredits,
    monthlyCredits: freePlan.monthlyCredits,
    scraperLimit: freePlan.scraperLimit,
    isUnlimited: false,
    canceledAt: now,
    updatedAt: now,
  });

  // Log cancellation event
  await adminDB
    .collection("users")
    .doc(uid)
    .collection("events")
    .add({
      type: "subscription_cancelled",
      timestamp: now,
    });

  console.log(`[Billing] Cancelled subscription for user ${uid}`);
}
