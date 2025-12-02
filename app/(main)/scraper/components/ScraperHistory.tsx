"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ScrapeHistoryItem } from "@/lib/scraper/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface ScraperHistoryProps {
    onSelect: (item: ScrapeHistoryItem) => void;
    selectedId?: string | null;
}

export function ScraperHistory({ onSelect, selectedId }: ScraperHistoryProps) {
    const [history, setHistory] = useState<ScrapeHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                const q = query(
                    collection(db, "users", user.uid, "scrapes"),
                    orderBy("timestamp", "desc"),
                    limit(20)
                );

                const unsubSnapshot = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as ScrapeHistoryItem[];
                    setHistory(items);
                    setLoading(false);
                });

                return () => unsubSnapshot();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No recent scrapes
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-r border-border/50 bg-card/30 backdrop-blur-sm w-75">
            <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Recent Scrapes
                </h3>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg text-sm transition-all hover:bg-accent group relative border border-transparent",
                                selectedId === item.id ? "bg-accent border-primary/20" : ""
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {item.favicon ? (

                                    <Image unoptimized width={16} height={16} src={item.favicon} alt="" className="w-4 h-4 mt-0.5 rounded-sm opacity-70" />
                                ) : (
                                    <div className="w-4 h-4 mt-0.5 rounded-sm bg-primary/10" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-foreground/90 group-hover:text-primary transition-colors">
                                        {item.title || item.url}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {new URL(item.url).hostname}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                    </p>
                                </div>
                                <ChevronRight className={cn(
                                    "h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-1/2 -translate-y-1/2",
                                    selectedId === item.id ? "opacity-100 text-primary" : ""
                                )} />
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
