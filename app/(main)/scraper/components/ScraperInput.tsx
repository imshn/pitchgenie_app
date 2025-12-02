"use client";

import { useState, useEffect } from "react";
import { Search, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScraperInputProps {
    onScrape: (url: string) => void;
    loading: boolean;
}

const PLACEHOLDERS = [
    "https://linear.app",
    "https://vercel.com",
    "https://stripe.com",
    "https://airbnb.com",
    "https://notion.so"
];

export function ScraperInput({ onScrape, loading }: ScraperInputProps) {
    const [url, setUrl] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onScrape(url);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="relative group">
                <div className={cn(
                    "absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-purple-500/50 to-blue-500/50 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200",
                    isFocused ? "opacity-100" : ""
                )} />

                <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl">
                    <div className="pl-2">
                        <Search className={cn("h-5 w-5 mr-2 ml-0 transition-colors text-gray-500 dark:text-gray-300", isFocused ? "text-primary dark:text-primary" : "")} />
                    </div>

                    <div className="flex-1 relative h-12">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="absolute inset-0 w-full h-full border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-transparent"
                            disabled={loading}
                        />
                        <AnimatePresence mode="wait">
                            {!url && (
                                <motion.div
                                    key={placeholderIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute inset-0 px-3 flex items-center text-muted-foreground/50 pointer-events-none text-lg"
                                >
                                    Try "{PLACEHOLDERS[placeholderIndex]}"
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        disabled={loading || !url.trim()}
                        className={cn(
                            "h-12 px-8 rounded-lg font-medium transition-all duration-300",
                            loading ? "bg-primary/80" : "bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
                        )}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-white rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                                <span className="ml-2">Scraping...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Scrape</span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </Button>
                </div>
            </form>

            {/* Credit Usage Banner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70"
            >
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span>This scrape uses <span className="font-semibold text-primary">5 credits</span></span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span>AI-Powered Extraction</span>
                </div>
            </motion.div>
        </div>
    );
}
