
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { z } from "zod";

// Validation Schema
const profileSchema = z.object({
  displayName: z.string().min(1).max(100),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.object({
    name: z.string().optional(),
    website: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    services: z.array(z.string()).optional(),
  }).optional(),
  persona: z.string().optional(),
  pitchTone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const profileDoc = await adminDB
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("main")
      .get();

    if (!profileDoc.exists) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: profileDoc.data() });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    
    // Validate
    const result = profileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    
    // Sanitize (basic example)
    // In a real app, use a library like dompurify if accepting HTML, but here we just store strings.
    
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("main")
      .set({
        ...data,
        updatedAt: Date.now()
      }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
