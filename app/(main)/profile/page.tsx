/* eslint-disable @typescript-eslint/no-explicit-any */
// app/profile/page.tsx
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({ about: "", company: "", gender: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return;
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setProfile(snap.data());
    });
    return () => unsub();
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      const u = auth.currentUser;
      if (!u) return toast.error("Login required");
      await setDoc(doc(db, "users", u.uid), profile, { merge: true });
      toast.success("Saved");
    } catch (err: any) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="glass card">
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-gray-300 mt-2">Tell us about yourself for better personalized emails</p>

        <div className="mt-4 space-y-3">
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" placeholder="Company" value={profile.company || ""} onChange={(e)=> setProfile({...profile, company: e.target.value})} />
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" placeholder="Gender" value={profile.gender || ""} onChange={(e)=> setProfile({...profile, gender: e.target.value})} />
          <textarea className="w-full p-3 rounded-md bg-transparent border border-white/6" placeholder="About you" value={profile.about || ""} onChange={(e)=> setProfile({...profile, about: e.target.value})} />
          <button className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </AuthGuard>
  );
}