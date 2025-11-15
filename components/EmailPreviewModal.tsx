/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EmailPreviewModal({
  open,
  onClose,
  subject,
  body,
  followUp,
}: any) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied to clipboard!",
        onPause: function (): void {
            throw new Error("Function not implemented.");
        },
        onOpenChange: function (open: boolean): void {
            throw new Error("Function not implemented.");
        },
        onAutoClose: function (): void {
            throw new Error("Function not implemented.");
        },
        onResume: function (): void {
            throw new Error("Function not implemented.");
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-lg bg-background border border-border shadow-lg">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>{subject}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Initial Email</TabsTrigger>
            <TabsTrigger value="followup">Follow-up</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <div className="relative p-4 border rounded-md mt-4 bg-muted/20">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(body)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <p className="text-sm whitespace-pre-wrap text-foreground">{body}</p>
            </div>
          </TabsContent>
          <TabsContent value="followup">
            <div className="relative p-4 border rounded-md mt-4 bg-muted/20">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(followUp)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <p className="text-sm whitespace-pre-wrap text-foreground">{followUp}</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
