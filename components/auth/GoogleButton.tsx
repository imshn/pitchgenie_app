"use client";

import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function GoogleButton(props: { text: string; }) {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Call Bootstrap API
      const token = await result.user.getIdToken();
      await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: result.user.displayName,
          email: result.user.email
        })
      });

      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google login error:", err);
      toast.error(err.message || "Google login failed");
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      className="w-full px-4 py-6 rounded-lg bg-white hover:bg-white/90 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow"
      variant="outline"
    >
      <FcGoogle size={22} /> {props?.text || "Continue with Google"}
    </Button>
  );
}
