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
    
    // Fetch real-time plan usage to match sidebar
    const { getUserPlan } = await import("@/lib/server/getUserPlan");
    const plan = await getUserPlan(uid);

    // Merge with real-time lead count and credit usage
    const summary = {
      ...summaryData,
      leads_total: totalLeads, // Use leads_total to match frontend expectations
      credits_used_total: plan.usage.creditsUsed, // Sync with billing cycle usage
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

    // Get timezone from query params
    const { searchParams } = new URL(req.url);
    const timezone = searchParams.get('timezone') || 'UTC';

    // Build 30‑day time series based on user's timezone
    const seriesMap: Record<string, any> = {};
    
    // Get "today" in user's timezone (YYYY-MM-DD)
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(todayStr); // Parsed as UTC midnight
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
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
      // Convert event timestamp to user's timezone date string
      const dateKey = new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: timezone });
      
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
