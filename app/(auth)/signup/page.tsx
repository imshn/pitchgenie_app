/* eslint-disable @typescript-eslint/no-explicit-any */
// app/signup/page.tsx
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [loading, setLoading]   = useState(false);

  const ensureUserDoc = async (user: any) => {
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { fullName: fullName || user.email, email: user.email, plan: "free", credits: 50, createdAt: Date.now() }, { merge: true });
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: fullName });
      await ensureUserDoc(res.user);
      toast.success("Account created");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md glass p-8 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2">Create account</h2>
        <p className="text-sm text-gray-300 mb-6">Start using PitchGenie</p>

        <form onSubmit={signup} className="space-y-4">
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" placeholder="Full name" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <button type="submit" className="w-full p-3 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 font-semibold" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-4">Already have an account? <a href="/login" className="text-white underline">Sign in</a></p>
      </div>
    </div>
  );
}