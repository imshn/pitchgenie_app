"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface RawDataViewerProps {
    data: any;
}

export function RawDataViewer({ data }: RawDataViewerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        toast.success("JSON copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-8 border border-border/50 rounded-lg overflow-hidden bg-card/20 backdrop-blur-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Code className="h-4 w-4 text-primary" />
                    View Raw Data
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="relative bg-black/50 p-4 overflow-x-auto">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-white"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <pre className="text-xs font-mono text-green-400/90 leading-relaxed">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
