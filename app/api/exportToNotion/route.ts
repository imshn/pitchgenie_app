/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/exportToNotion/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin"; // adjust path
import fetch from "node-fetch"; // node 18 fetch may be available; otherwise use node-fetch

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, leadId } = await req.json();
    if (uid !== decoded.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const leadSnap = await adminDB.collection("leads").doc(leadId).get();
    if (!leadSnap.exists) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const lead = leadSnap.data();

    const notionToken = process.env.NOTION_TOKEN;
    const parentId = process.env.NOTION_PARENT_PAGE_ID;
    if (!notionToken || !parentId) return NextResponse.json({ error: "Notion not configured" }, { status: 500 });

    // Build Notion page content: simple title + properties and body as rich_text block
    const body = {
      parent: { page_id: parentId }, // If using database, parent: { database_id: parentId }
      properties: {
        title: {
          title: [{ text: { content: `${lead?.name} — ${lead?.company || ""}` } }]
        },
        // add additional properties if using a database
      },
      children: [
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Lead Details" } }] }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `Role: ${lead?.role || ""}\nWebsite: ${lead?.website || ""}\nStatus: ${lead?.status || ""}`
                }
              }
            ]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content: `AI Summary:\n${lead?.aiSummary || ""}` } }] }
        },
      ],
    };

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Notion error:", text);
      return NextResponse.json({ error: "Notion API error", detail: text }, { status: 500 });
    }

    const json: any = await res.json();

    // Save notion page id to lead for reference
    await adminDB.collection("leads").doc(leadId).update({ notionPageId: json.id as string, notionSyncedAt: new Date().toISOString() });

    return NextResponse.json({ success: true, page: json });
  } catch (e: any) {
    console.error("Export to Notion error:", e);
    return NextResponse.json({ error: "Internal" , detail: e.message }, { status: 500 });
  }
}
