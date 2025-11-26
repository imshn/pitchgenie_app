import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

const PLANS = {
  free: {
    name: "Free",
    memberLimit: 2,
    creditLimit: 50,
    scraperLimit: 3,
    sequenceLimit: 1,
    templateLimit: 3,
    toneLimit: 2,
    apiAccess: false,
    deepScraper: false,
    smtpCustom: false,
    analyticsLevel: 0,
    price: 0
  },
  starter: {
    name: "Starter",
    memberLimit: 4,
    creditLimit: 600,
    scraperLimit: -1, // Unlimited
    sequenceLimit: 5,
    templateLimit: 10,
    toneLimit: 5,
    apiAccess: false,
    deepScraper: true,
    smtpCustom: true,
    analyticsLevel: 1,
    price: 29
  },
  pro: {
    name: "Pro",
    memberLimit: 6,
    creditLimit: 1500,
    scraperLimit: -1,
    sequenceLimit: 15,
    templateLimit: 25,
    toneLimit: 10,
    apiAccess: true,
    deepScraper: true,
    smtpCustom: true,
    analyticsLevel: 2,
    price: 79
  },
  agency: {
    name: "Agency",
    memberLimit: 20,
    creditLimit: 5000,
    scraperLimit: -1,
    sequenceLimit: 50,
    templateLimit: 100,
    toneLimit: 20,
    apiAccess: true,
    deepScraper: true,
    smtpCustom: true,
    analyticsLevel: 3,
    price: 199
  }
};

export async function GET(req: Request) {
  try {
    const batch = adminDB.batch();

    for (const [key, data] of Object.entries(PLANS)) {
      const ref = adminDB.collection("plans").doc(key);
      batch.set(ref, data, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: "Plans seeded successfully" });
  } catch (error: any) {
    console.error("SEED PLANS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
