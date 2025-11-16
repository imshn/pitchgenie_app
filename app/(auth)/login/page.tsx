/* eslint-disable @typescript-eslint/no-explicit-any */
// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md glass p-8 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
        <p className="text-sm text-gray-300 mb-6">Login to continue to PitchGenie</p>

        <form onSubmit={handle} className="space-y-4">
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full p-3 rounded-md bg-transparent border border-white/6" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <button type="submit" className="w-full p-3 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 font-semibold" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-4">No account? <a href="/signup" className="text-white underline">Sign up</a></p>
      </div>
    </div>
  );
}