"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import { PlanType } from "@/lib/credit-types";

interface Workspace {
    id: string;
    name: string;
    planId: string;
    role: "owner" | "admin" | "member";
    [key: string]: any;
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    currentWorkspaceId: string;
    isLoading: boolean;
    refreshWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
    workspaces: [],
    currentWorkspace: null,
    currentWorkspaceId: "",
    isLoading: true,
    refreshWorkspaces: () => { },
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubDoc: () => void;
        let unsubWorkspaces: () => void;

        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                // 1. Listen to User Document for current workspace ID
                unsubDoc = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentWorkspaceId(userData.currentWorkspaceId || "");
                    }
                });

                // 2. Listen to Workspaces Collection
                const q = query(
                    collection(db, "workspaces"),
                    where("memberIds", "array-contains", user.uid)
                );

                unsubWorkspaces = onSnapshot(q, (snap) => {
                    const workspacesData = snap.docs.map(d => ({
                        id: d.id,
                        ...d.data(),
                        name: d.data().workspaceName || "My Workspace",
                        // role: d.data().ownerId === user.uid ? "owner" : "member" // Simplified role logic
                    })) as Workspace[];

                    setWorkspaces(workspacesData);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Failed to subscribe to workspaces", error);
                    setIsLoading(false);
                });

            } else {
                setWorkspaces([]);
                setCurrentWorkspaceId("");
                setIsLoading(false);
            }
        });

        return () => {
            unsubAuth();
            if (unsubDoc) unsubDoc();
            if (unsubWorkspaces) unsubWorkspaces();
        };
    }, []);

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            currentWorkspace,
            currentWorkspaceId,
            isLoading,
            refreshWorkspaces: () => { } // Realtime updates handle this
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export const useWorkspace = () => useContext(WorkspaceContext);
