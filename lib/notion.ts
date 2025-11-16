/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/notion.ts
import fetch from "node-fetch"; // If using Node 18+ built-in fetch is ok; keep for clarity.

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API = "https://api.notion.com/v1/pages";

if (!NOTION_TOKEN) {
  console.warn("Warning: NOTION_TOKEN is not set. Notion exports will fail.");
}

export async function createNotionPage({
  title,
  company,
  role,
  body,
  followUp,
  website,
  status,
  leadId,
  extra = {},
}: {
  title: string;
  company?: string;
  role?: string;
  body?: string;
  followUp?: string;
  website?: string;
  status?: string;
  leadId?: string;
  extra?: Record<string, any>;
}) {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    throw new Error("Missing NOTION_TOKEN or NOTION_DATABASE_ID env vars");
  }

  // Build properties according to recommended Notion schema (title + plain text)
  const properties: any = {
    Name: {
      title: [{ type: "text", text: { content: title || "Untitled" } }],
    },
  };

  if (company) properties.Company = { rich_text: [{ type: "text", text: { content: company } }] };
  if (role) properties.Role = { rich_text: [{ type: "text", text: { content: role } }] };
  if (status) properties.Status = { rich_text: [{ type: "text", text: { content: status } }] };
  if (website) properties.Website = { url: website };

  // Add lead id as a property for traceability
  if (leadId) properties.LeadId = { rich_text: [{ type: "text", text: { content: leadId } }] };

  // If the target DB doesn't have these props, Notion will ignore unknown ones (so keep minimal).
  // Prepare page body blocks (email body + follow-up + extra)
  const children: any[] = [];

  if (body) {
    children.push({
      object: "block",
      type: "heading_3",
      heading_3: { rich_text: [{ type: "text", text: { content: "Email Body" } }] },
    });
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: body } }] },
    });
  }

  if (followUp) {
    children.push({
      object: "block",
      type: "heading_3",
      heading_3: { rich_text: [{ type: "text", text: { content: "Follow-up" } }] },
    });
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: followUp } }] },
    });
  }

  // Extra info
  if (website || Object.keys(extra).length > 0) {
    children.push({
      object: "block",
      type: "heading_3",
      heading_3: { rich_text: [{ type: "text", text: { content: "Meta" } }] },
    });
    const metaPx = (website ? `Website: ${website}\n` : "") + Object.entries(extra).map(([k,v]) => `${k}: ${v}`).join("\n");
    if (metaPx) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: metaPx } }] },
      });
    }
  }

  const payload = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties,
    children,
  };

  const res = await fetch(NOTION_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Notion API error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  return json;
}
