import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";

export function UpgradeScreen() {
    return (
        <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-muted/5">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Unlock Your Inbox</h2>
            <p className="text-muted-foreground max-w-md mb-8 text-lg">
                Upgrade to Starter or Pro to manage conversations, track replies, and close deals faster.
            </p>
            <Link href="/billing">
                <Button size="lg" className="h-12 px-8 text-base">Upgrade Plan</Button>
            </Link>
        </div>
    );
}
