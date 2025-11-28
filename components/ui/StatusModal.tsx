"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
}

export function StatusModal({ isOpen, onClose, type, title, message }: StatusModalProps) {
    const config = {
        success: {
            icon: CheckCircle,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/20",
            buttonColor: "bg-green-600 hover:bg-green-700",
        },
        error: {
            icon: XCircle,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            borderColor: "border-red-500/20",
            buttonColor: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: AlertTriangle,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            borderColor: "border-orange-500/20",
            buttonColor: "bg-orange-600 hover:bg-orange-700",
        },
    };

    const { icon: Icon, color, bgColor, borderColor, buttonColor } = config[type];

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className={cn("border-2", borderColor)}>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", bgColor)}>
                            <Icon className={cn("w-6 h-6", color)} />
                        </div>
                        <AlertDialogTitle className={cn("text-xl", color)}>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base mt-2 text-foreground/90">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose} className={cn(buttonColor, "text-white")}>
                        Okay
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
