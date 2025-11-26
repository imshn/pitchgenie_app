import { NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/lib/firebase-admin';

// Helper to get start of day timestamp
function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const workspaceId = userDoc.data()?.currentWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json({ summary: {}, timeseries: [], recent: [] });
    }

    const parentRef = adminDB.collection("workspaces").doc(workspaceId);

    // Count total leads from workspace
    const leadsSnap = await parentRef.collection('leads').count().get();
    const totalLeads = leadsSnap.data().count;

    // Fetch summary document
    const summarySnap = await parentRef
      .collection('analytics')
      .doc('summary')
      .get();
    const summaryData = summarySnap.exists ? summarySnap.data() : {};
    
    // Merge with real-time lead count
    const summary = {
      ...summaryData,
      leads_total: totalLeads, // Use leads_total to match frontend expectations
    };

    // Fetch last 30 days of events
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const eventsSnap = await parentRef
      .collection('events')
      .where('timestamp', '>=', thirtyDaysAgo)
      .orderBy('timestamp', 'desc')
      .get();
    const events: any[] = [];
    eventsSnap.forEach((doc) => events.push({ id: doc.id, ...doc.data() }));

    // Build 30‑day time series
    const seriesMap: Record<string, any> = {};
    for (let i = 0; i < 30; i++) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = day.toISOString().split('T')[0]; // YYYY‑MM‑DD
      seriesMap[key] = {
        date: key,
        email_generated: 0,
        email_sent: 0,
        sequence_generated: 0,
        scraper_run: 0,
        credits_used: 0,
      };
    }
    events.forEach((e) => {
      const dateKey = new Date(e.timestamp).toISOString().split('T')[0];
      if (!seriesMap[dateKey]) return; // outside 30‑day window
      if (e.cost) {
        seriesMap[dateKey].credits_used += e.cost;
      }
      
      switch (e.type) {
        case 'email_generated':
          seriesMap[dateKey].email_generated += 1;
          break;
        case 'email_sent':
          seriesMap[dateKey].email_sent += 1;
          break;
        case 'sequence_generated':
          seriesMap[dateKey].sequence_generated += 1;
          break;
        case 'scraper_run':
          seriesMap[dateKey].scraper_run += 1;
          break;
        default:
          break;
      }
    });
    const timeseries = Object.values(seriesMap).sort((a, b) => a.date.localeCompare(b.date));

    // Most recent 20 events (already ordered desc)
    const recent = events.slice(0, 20);

    return NextResponse.json({ summary, timeseries, recent });
  } catch (error) {
    console.error('[Analytics Summary] Error:', error);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 401 });
  }
}
