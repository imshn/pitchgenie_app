import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get IP and User Agent
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "Unknown IP";
    const userAgent = headersList.get("user-agent") || "Unknown Device";

    // Generate a stable Session ID based on IP + UA (to group same device/network)
    const sessionId = crypto
      .createHash("md5")
      .update(`${uid}-${ip}-${userAgent}`)
      .digest("hex");

    // Fetch Location Data
    let location = "Unknown Location";
    try {
      // Use a free IP geolocation service (rate limits apply, but good for demo)
      // In production, use a paid service or a database like MaxMind
      if (ip !== "Unknown IP" && ip !== "::1" && ip !== "127.0.0.1") {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          location = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
        }
      } else {
        location = "Localhost / Private Network";
      }
    } catch (err) {
      console.error("Geo lookup failed:", err);
    }

    // Update Firestore
    const sessionRef = adminDB
      .collection("users")
      .doc(uid)
      .collection("sessions")
      .doc(sessionId);

    const sessionData = {
      id: sessionId,
      ip,
      userAgent,
      location,
      lastActive: Date.now(),
      deviceType: getDeviceType(userAgent),
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
    };

    await sessionRef.set(sessionData, { merge: true });

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Session record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Simple UA parsers (server-side)
function getDeviceType(ua: string) {
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}

function getBrowser(ua: string) {
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/edge/i.test(ua)) return "Edge";
  return "Unknown Browser";
}

function getOS(ua: string) {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/ios/i.test(ua)) return "iOS";
  return "Unknown OS";
}
