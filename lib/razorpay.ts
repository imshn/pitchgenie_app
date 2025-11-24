/**
 * Razorpay Client Initialization
 * 
 * Environment variables required:
 * - RAZORPAY_KEY_ID: Your Razorpay API key (test or live)
 * - RAZORPAY_KEY_SECRET: Your Razorpay API secret
 * 
 * Get these from: https://dashboard.razorpay.com/app/keys
 */

import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay credentials not found in environment variables");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan ID mappings (create these plans in Razorpay dashboard)
export const RAZORPAY_PLANS = {
  starter: process.env.RAZORPAY_PLAN_STARTER || "",
  pro: process.env.RAZORPAY_PLAN_PRO || "",
  agency: process.env.RAZORPAY_PLAN_AGENCY || "",
} as const;

// Plan prices (in paise - Razorpay uses smallest currency unit)
export const PLAN_PRICES = {
  starter: 149900, // ₹1,499
  pro: 249900,     // ₹2,499
  agency: 499900,  // ₹4,999
} as const;

export type RazorpayPlanName = keyof typeof RAZORPAY_PLANS;
