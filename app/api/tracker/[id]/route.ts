import { NextResponse } from 'next/server';
import { adminDB, FieldValue } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

// 1x1 Transparent GIF Fallback
const pixelBuffer = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Strip .gif extension if present (to bypass ngrok warning)
    const leadId = id.replace('.gif', '');
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    console.log(`[Tracking] Incoming request for lead: ${leadId}, UA: ${userAgent}`);
    
    const { searchParams } = new URL(req.url);

    if (!leadId) {
      // Still return pixel even if invalid to avoid broken image icon
      return new NextResponse(pixelBuffer, {
        headers: { 'Content-Type': 'image/gif' },
      });
    }

    // Find the workspace this lead belongs to
    // Since we don't have workspaceId in the URL, we have to search for the lead
    // This is expensive if we scan all workspaces. 
    // Optimization: We should probably include workspaceId in the tracking URL too.
    // But for now, let's assume we can find it or the user provides it.
    // Actually, the previous implementation plan didn't specify workspaceId.
    // Let's try to find the lead by ID across workspaces or assume we pass workspaceId.
    // To be safe and performant, let's update the plan to include workspaceId in the URL.
    // Wait, I can't update the plan now without user interaction.
    // Let's look at how other APIs find leads. They usually have workspaceId from auth.
    // Here we have no auth.
    
    // Let's try to pass workspaceId in the URL as well.
    const workspaceId = searchParams.get('ws');

    if (workspaceId && leadId) {
      console.log(`[Tracking] Pixel hit for Lead: ${leadId}, Workspace: ${workspaceId}`);
      
      const leadRef = adminDB
        .collection('workspaces')
        .doc(workspaceId)
        .collection('leads')
        .doc(leadId);

      try {
        // Update Lead
        await leadRef.update({
          status: 'opened',
          lastOpenedAt: FieldValue.serverTimestamp(),
          opens: FieldValue.increment(1),
        });
        console.log('[Tracking] Lead status updated to opened');

        // Add to Timeline
        await leadRef.collection('timeline').add({
          type: 'email_opened',
          text: 'Email opened',
          createdAt: FieldValue.serverTimestamp(),
        });

        // Add Analytics Event
        await adminDB
          .collection('workspaces')
          .doc(workspaceId)
          .collection('events')
          .add({
            type: 'email_opened',
            leadId,
            timestamp: Date.now(),
          });
          
        // Update Summary Stats
        await adminDB
          .collection('workspaces')
          .doc(workspaceId)
          .collection('analytics')
          .doc('summary')
          .set({
            emails_opened_total: FieldValue.increment(1)
          }, { merge: true });
          
        console.log('[Tracking] All stats updated successfully');

      } catch (err) {
        console.error('[Tracking] Error updating lead:', err);
      }
    } else {
      console.log('[Tracking] Missing workspaceId or leadId', { workspaceId, leadId });
    }

    // Read the actual file from public folder (as per article)
    const filePath = path.join(process.cwd(), 'public', 'tracking.gif');
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Tracking] Error:', error);
    
    // Fallback 1x1 pixel if file read fails
    const pixelBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    return new NextResponse(pixelBuffer, {
      headers: { 
        'Content-Type': 'image/gif',
        'Content-Length': pixelBuffer.length.toString(),
      },
    });
  }
}
