"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

export default function ClientAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setChecking(false);
        return;
      }

      // Auto-heal / Bootstrap on session start
      try {
        const token = await u.getIdToken();
        // Fire and forget bootstrap to ensure docs exist
        fetch("/api/auth/bootstrap", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }).catch(e => console.error("Bootstrap error:", e));
      } catch (e) {
        console.error("Token error:", e);
      }

      // Fetch user doc to check plan and onboarding status
      try {
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const planType = userData.planType || "free";
          const onboardingCompleted = userData.onboardingCompleted;

          // REDIRECT LOGIC
          const isOnboardingPage = pathname.startsWith("/onboarding");
          const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

          if (isAuthPage) {
            // Let auth pages handle themselves (usually redirect to dashboard if logged in)
            // But we can enforce it here too if needed.
            // For now, let's focus on protecting app routes and enforcing onboarding.
          } else {
            if (planType !== "free") {
              // Paid user: NEVER show onboarding
              if (isOnboardingPage) {
                router.replace("/dashboard");
              }
            } else {
              // Free user
              if (onboardingCompleted === true) {
                // Completed onboarding: Go to dashboard
                if (isOnboardingPage) {
                  router.replace("/dashboard");
                }
              } else {
                // Not completed onboarding: Force onboarding
                // But handle legacy users: if onboardingCompleted is undefined, treat as true?
                // The prompt says: "IF planType !== 'free': set onboardingCompleted = true. ELSE: set onboardingCompleted = true // old free users should not be forced"
                // So effectively, if it's missing, we treat it as true (or we should have updated it).
                // Let's treat missing as TRUE to be safe for existing users, unless we are sure they are new.
                // New users created by our new code WILL have onboardingCompleted: false.
                // Old users WON'T have it.

                if (onboardingCompleted === undefined) {
                  // Legacy user -> Treat as completed
                  if (isOnboardingPage) {
                    router.replace("/dashboard");
                  }
                } else if (onboardingCompleted === false) {
                  // Explicitly incomplete -> Force onboarding
                  if (!isOnboardingPage) {
                    router.replace("/onboarding/step1");
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}