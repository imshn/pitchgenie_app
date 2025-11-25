/**
 * Plan Card Component
 * 
 * Displays plan details for selection with glow and bounce animations
 */

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanCardProps {
    name: string;
    price: number;
    credits: number | string;
    scraperLimit: number | string;
    features: string[];
    isSelected: boolean;
    isRecommended?: boolean;
    onSelect: () => void;
}

export function PlanCard({
    name,
    price,
    credits,
    scraperLimit,
    features,
    isSelected,
    isRecommended,
    onSelect,
}: PlanCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card
                className={`
          relative cursor-pointer transition-all
          ${isSelected
                        ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                        : "hover:shadow-lg"
                    }
        `}
                onClick={onSelect}
            >
                {isRecommended && (
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                            Recommended
                        </Badge>
                    </motion.div>
                )}

                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        {name}
                        {isSelected && (
                            <motion.div
                                className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <Check className="h-4 w-4 text-primary-foreground" />
                            </motion.div>
                        )}
                    </CardTitle>
                    <CardDescription>
                        <span className="text-3xl font-bold text-foreground">
                            {price === 0 ? "Free" : `₹${price}`}
                        </span>
                        {price > 0 && <span className="text-sm">/month</span>}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Credits per month</p>
                            <p className="text-lg font-semibold">{credits === Infinity ? "Unlimited" : credits}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Scraper limit</p>
                            <p className="text-lg font-semibold">
                                {scraperLimit === Infinity ? "Unlimited" : scraperLimit}
                            </p>
                        </div>

                        <div className="border-t pt-3 mt-3">
                            <p className="text-sm font-medium mb-2">Features:</p>
                            <ul className="space-y-1">
                                {features.map((feature, index) => (
                                    <motion.li
                                        key={index}
                                        className="text-sm text-muted-foreground flex items-start gap-2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            className="w-full mt-4"
                            variant={isSelected ? "default" : "outline"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                        >
                            {isSelected ? "Selected" : "Select Plan"}
                        </Button>
                    </motion.div>
                </CardContent>

                {/* Glow effect for selected card */}
                {isSelected && (
                    <motion.div
                        className="absolute inset-0 -z-10 bg-primary/10 rounded-lg blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </Card>
        </motion.div>
    );
}
