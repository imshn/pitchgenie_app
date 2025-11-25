/**
 * WelcomeModal Component
 * Initial modal for starting the product tour
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

interface WelcomeModalProps {
    isOpen: boolean;
    onStart: () => void;
    onSkip: () => void;
}

export function WelcomeModal({ isOpen, onStart, onSkip }: WelcomeModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onSkip}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative z-10"
                >
                    <Card className="w-full max-w-md border-2 border-primary/50 shadow-2xl">
                        <CardHeader className="text-center pb-6">
                            <motion.div
                                className="flex justify-center mb-4"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                            </motion.div>
                            <CardTitle className="text-2xl font-bold">
                                Welcome to PitchGenie! 🎉
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                Let's take a quick tour to help you get started with AI-powered lead outreach.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                        1
                                    </div>
                                    <span className="text-muted-foreground">Upload and manage your lead lists</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                        2
                                    </div>
                                    <span className="text-muted-foreground">Generate personalized AI emails</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                        3
                                    </div>
                                    <span className="text-muted-foreground">Track your pipeline and analytics</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" onClick={onSkip} className="flex-1">
                                    Skip Tour
                                </Button>
                                <Button onClick={onStart} className="flex-1 gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Start Tour
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
