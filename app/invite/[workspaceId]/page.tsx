"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InviteAcceptPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    useEffect(() => {
        const handleInvite = async () => {
            try {
                // Check if user is authenticated
                const user = auth.currentUser;

                if (!user) {
                    // Redirect to signup with invite preserved
                    router.push(`/signup?invite=${workspaceId}&redirect=/invite/${workspaceId}`);
                    return;
                }

                // User is authenticated, accept the invite
                const token = await user.getIdToken();
                const res = await axios.post(
                    "/api/workspaces/accept",
                    { workspaceId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data.success) {
                    setStatus("success");
                    setMessage("You've successfully joined the workspace!");
                    setWorkspaceName(res.data.workspaceName || "");

                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 2000);
                } else {
                    setStatus("error");
                    setMessage(res.data.message || "No pending invitation found.");
                }
            } catch (error: any) {
                console.error("Invite acceptance error:", error);
                setStatus("error");
                setMessage(error.response?.data?.error || "Failed to accept invitation");
            }
        };

        // Wait for auth to initialize
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user !== undefined) {
                handleInvite();
            }
        });

        return () => unsubscribe();
    }, [workspaceId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">
                        {status === "loading" && "Processing Invitation"}
                        {status === "success" && "Invitation Accepted!"}
                        {status === "error" && "Invitation Error"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {status === "loading" && "Please wait while we process your invitation..."}
                        {status === "success" && `Welcome to ${workspaceName || "the workspace"}!`}
                        {status === "error" && "There was a problem with your invitation"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {status === "loading" && (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    )}
                    {status === "success" && (
                        <>
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="text-sm text-muted-foreground text-center">{message}</p>
                            <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <XCircle className="h-12 w-12 text-red-500" />
                            <p className="text-sm text-muted-foreground text-center">{message}</p>
                            <Button onClick={() => router.push("/dashboard")} className="mt-4">
                                Go to Dashboard
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
