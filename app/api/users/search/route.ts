import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function GET(req: Request) {
  try {
    await verifyUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json({ users: [] });
    }

    // Search users by email
    // Note: Firestore doesn't support native partial text search easily without third-party services like Algolia.
    // For a simple implementation, we'll use startAt/endAt on the email field if it's indexed,
    // or just exact match if we want to be strict.
    // However, for autocomplete, we want partial match.
    // A common workaround is: where('email', '>=', query).where('email', '<=', query + '\uf8ff')
    
    const usersRef = adminDB.collection("users");
    const snapshot = await usersRef
      .where("email", ">=", query.toLowerCase())
      .where("email", "<=", query.toLowerCase() + "\uf8ff")
      .limit(5)
      .get();

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName || data.name || "",
        photoURL: data.photoURL || ""
      };
    });

    return NextResponse.json({ users });

  } catch (error: any) {
    console.error("USER SEARCH ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
