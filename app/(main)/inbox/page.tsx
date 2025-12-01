"use client";

import { InboxClient } from "@/components/inbox/InboxClient";
import AuthGuard from "@/components/AuthGuard";
import { UpgradeScreen } from "@/components/inbox/UpgradeScreen";
import { useAuth } from "@/app/hooks/useAuth";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function InboxPage() {
    const { user, loading: authLoading } = useAuth();
    const [planType, setPlanType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPlan = async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    setPlanType(snap.data().planType || "free");
                } else {
                    setPlanType("free");
                }
            } catch (error) {
                console.error("Error fetching plan:", error);
                setPlanType("free");
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (planType === "free") {
        return (
            <AuthGuard>
                <UpgradeScreen />
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <InboxClient />
        </AuthGuard>
    );
}
