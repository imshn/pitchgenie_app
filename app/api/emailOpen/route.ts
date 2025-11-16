// app/api/emailOpen/route.ts
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const leadId = url.searchParams.get("leadId");
    const openId = url.searchParams.get("openId");

    if (!leadId || !openId) {
      // return a 1x1 transparent gif
      return new NextResponse(Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64"), {
        headers: { "Content-Type": "image/gif" },
      });
    }

    // Save open record
    await adminDB.collection("emailOpens").add({
      leadId,
      openId,
      ts: new Date().toISOString(),
      // optionally record ip/user-agent if you want (be mindful of privacy)
    });

    // Return a 1x1 transparent gif (base64 GIF)
    return new NextResponse(Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64"), {
      headers: { "Content-Type": "image/gif" },
    });
  } catch (e) {
    console.error("emailOpen error", e);
    return new NextResponse(Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64"), {
      headers: { "Content-Type": "image/gif" },
    });
  }
}
