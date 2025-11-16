import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const leadId = url.searchParams.get("leadId");
    const target = url.searchParams.get("url");

    if (!leadId || !target) {
      return NextResponse.redirect("https://google.com");
    }

    // Log click
    await adminDB.collection("emailClicks").add({
      leadId,
      url: target,
      ts: new Date().toISOString(),
    });

    // Send user to the actual URL
    return NextResponse.redirect(target);
  } catch (e) {
    console.error("Click redirect error:", e);
    return NextResponse.redirect("https://google.com");
  }
}
