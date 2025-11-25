import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("🚀 Starting Repair...");

    const workspacesSnap = await adminDB.collection("workspaces").get();
    let repairedCount = 0;
    const batch = adminDB.batch();
    let opCount = 0;

    for (const doc of workspacesSnap.docs) {
      const data = doc.data();
      const members = data.members || [];
      const memberIds = data.memberIds || [];
      
      // Extract UIDs from members array
      const calculatedMemberIds = members.map((m: any) => m.uid);
      
      // Check if repair is needed
      const needsRepair = !data.memberIds || 
        JSON.stringify(memberIds.sort()) !== JSON.stringify(calculatedMemberIds.sort());

      if (needsRepair) {
        console.log(`Repairing workspace ${doc.id}...`);
        batch.update(doc.ref, {
          memberIds: calculatedMemberIds
        });
        
        repairedCount++;
        opCount++;
        
        if (opCount >= 400) {
          await batch.commit();
          opCount = 0;
        }
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      repaired: repairedCount, 
      total: workspacesSnap.size 
    });

  } catch (error: any) {
    console.error("REPAIR ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
