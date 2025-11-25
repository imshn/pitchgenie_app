"use client";

import { Button } from "@/components/ui/button";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

export default function GoogleButton(props: { text: string; }) {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Ensure user document exists with onboarding fields
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(
        userRef,
        {
          fullName: result.user.displayName || result.user.email,
          email: result.user.email,
          plan: "free",
          credits: 50,
          maxCredits: 50,
          monthlyCredits: 50,
          scraperLimit: 3,
          scraperUsed: 0,
          isUnlimited: false,
          onboardingCompleted: false,
          onboardingStep: 1,
          firstTimeTourCompleted: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
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
