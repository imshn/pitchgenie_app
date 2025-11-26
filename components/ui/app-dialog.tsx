"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DialogVariant = "success" | "error" | "warning" | "info" | "prompt" | "alert";

interface DialogConfig {
    open: boolean;
    variant?: DialogVariant;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
}

interface AppDialogProps extends DialogConfig {
    onOpenChange?: (open: boolean) => void;
}

export function AppDialog({
    open,
    variant = "alert",
    title,
    description,
    confirmText = "OK",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    onOpenChange,
    showCancel = false,
}: AppDialogProps) {

    const variantConfig = {
        success: {
            icon: CheckCircle2,
            iconColor: "text-green-500",
            actionColor: "bg-green-500 hover:bg-green-600",
        },
        error: {
            icon: XCircle,
            iconColor: "text-red-500",
            actionColor: "bg-red-500 hover:bg-red-600",
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-yellow-500",
            actionColor: "bg-yellow-500 hover:bg-yellow-600",
        },
        info: {
            icon: Info,
            iconColor: "text-blue-500",
            actionColor: "bg-blue-500 hover:bg-blue-600",
        },
        prompt: {
            icon: HelpCircle,
            iconColor: "text-purple-500",
            actionColor: "bg-purple-500 hover:bg-purple-600",
        },
        alert: {
            icon: AlertTriangle,
            iconColor: "text-orange-500",
            actionColor: "bg-orange-500 hover:bg-orange-600",
        },
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = () => {
        onConfirm?.();
        onOpenChange?.(false);
    };

    const handleCancel = () => {
        onCancel?.();
        onOpenChange?.(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <Icon className={cn("h-6 w-6", config.iconColor)} />
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {showCancel && (
                        <AlertDialogCancel onClick={handleCancel}>
                            {cancelText}
                        </AlertDialogCancel>
                    )}
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={cn(config.actionColor, "text-white")}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Hook for easier usage
export function useAppDialog() {
    const [dialogConfig, setDialogConfig] = React.useState<DialogConfig>({
        open: false,
        variant: "alert",
        title: "",
        description: "",
        showCancel: false,
    });

    const showDialog = (config: Omit<DialogConfig, "open">) => {
        setDialogConfig({ ...config, open: true });
    };

    const hideDialog = () => {
        setDialogConfig((prev) => ({ ...prev, open: false }));
    };

    const showSuccess = (title: string, description: string, onConfirm?: () => void) => {
        showDialog({ variant: "success", title, description, onConfirm, showCancel: false });
    };

    const showError = (title: string, description: string, onConfirm?: () => void) => {
        showDialog({ variant: "error", title, description, onConfirm, showCancel: false });
    };

    const showWarning = (title: string, description: string, onConfirm?: () => void) => {
        showDialog({ variant: "warning", title, description, onConfirm, showCancel: false });
    };

    const showInfo = (title: string, description: string, onConfirm?: () => void) => {
        showDialog({ variant: "info", title, description, onConfirm, showCancel: false });
    };

    const showPrompt = (
        title: string,
        description: string,
        onConfirm?: () => void,
        onCancel?: () => void,
        confirmText?: string,
        cancelText?: string
    ) => {
        showDialog({
            variant: "prompt",
            title,
            description,
            onConfirm,
            onCancel,
            confirmText,
            cancelText,
            showCancel: true,
        });
    };

    const showAlert = (
        title: string,
        description: string,
        onConfirm?: () => void,
        onCancel?: () => void,
        confirmText?: string,
        cancelText?: string
    ) => {
        showDialog({
            variant: "alert",
            title,
            description,
            onConfirm,
            onCancel,
            confirmText,
            cancelText,
            showCancel: true,
        });
    };

    return {
        dialogConfig,
        setDialogConfig,
        showDialog,
        hideDialog,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showPrompt,
        showAlert,
    };
}

// Add React import at top
import React from "react";
