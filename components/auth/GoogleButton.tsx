"use client";

import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FcGoogle } from "react-icons/fc";

export default function GoogleButton(props: { text: string; }) {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google login error:", err);
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
