import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Fetch from legacy main doc as requested
    const mainRef = adminDB.collection("users").doc(uid).collection("profile").doc("main");
    const mainSnap = await mainRef.get();

    console.log(`[Profile Get] UID: ${uid}`);
    console.log(`[Profile Get] Main Doc Exists: ${mainSnap.exists}`);

    const data = mainSnap.exists ? mainSnap.data() || {} : {};

    // Map fields from various formats to profile format
    const profile = {
        ...data,
        fullName: data.fullName || data.name || data.displayName || "",
        company: data.company || data.companyName || "",
        website: data.website || data.companyWebsite || "",
        services: data.services || data.servicesOffered || [],
        // Ensure other fields are present
        gender: data.gender || "",
        role: data.role || "",
        persona: data.persona || data.personaTone || "",
        companyDescription: data.companyDescription || "",
        companyLocation: data.companyLocation || "",
        about: data.about || "",
        linkedin: data.linkedin || "",
        timezone: data.timezone || "UTC",
        language: data.language || "en",
    };

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
