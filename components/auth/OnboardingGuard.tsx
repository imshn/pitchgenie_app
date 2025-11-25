/**
 * OnboardingGuard Component
 * 
 * Redirects users based on onboarding completion status
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkOnboarding = async () => {
            const user = auth.currentUser;

            // Skip auth pages
            if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
                setChecking(false);
                return;
            }

            if (!user) {
                // Not logged in, redirect to login
                if (!pathname?.startsWith("/login") && !pathname?.startsWith("/signup")) {
                    router.push("/login");
                }
                setChecking(false);
                return;
            }

            try {
                // Check onboarding status in Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const onboardingCompleted = userData?.onboardingCompleted || false;
                    const onboardingStep = userData?.onboardingStep || 1;

                    // If onboarding NOT completed
                    if (!onboardingCompleted) {
                        // If user is NOT on an onboarding page, redirect
                        if (!pathname?.startsWith("/onboarding")) {
                            router.push(`/onboarding/step${onboardingStep}`);
                        }
                    } else {
                        // If onboarding IS completed
                        // If user IS on an onboarding page, redirect to dashboard
                        if (pathname?.startsWith("/onboarding")) {
                            router.push("/dashboard");
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
            } finally {
                setChecking(false);
            }
        };

        // Wait for auth state to settle
        const unsub = auth.onAuthStateChanged(() => {
            checkOnboarding();
        });

        return () => unsub();
    }, [pathname, router]);

    if (checking) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
