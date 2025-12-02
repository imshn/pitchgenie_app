"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultCardProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    action?: React.ReactNode;
}

export function ResultCard({
    title,
    icon: Icon,
    iconColor = "text-primary",
    children,
    defaultOpen = true,
    className,
    action
}: ResultCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className={cn(
            "border-primary/10 bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_-10px_rgba(124,58,237,0.3)] group",
            className
        )}>
            <CardHeader
                className="p-4 cursor-pointer select-none flex flex-row items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <CardTitle className="flex items-center gap-3 text-lg font-medium tracking-tight">
                    <div className={cn("p-2 rounded-md bg-background/50 ring-1 ring-border/50 transition-colors group-hover:bg-primary/10", iconColor)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {title}
                </CardTitle>
                <div className="flex items-center gap-3">
                    {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
                    <div className={cn("transition-transform duration-300 text-muted-foreground", isOpen ? "rotate-180" : "")}>
                        <ChevronDown className="h-5 w-5" />
                    </div>
                </div>
            </CardHeader>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <CardContent className="p-4 pt-0">
                            {children}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
