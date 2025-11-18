/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { auth } from "@/lib/firebase";

export default function EmailPreviewModal({
  open,
  onClose,
  subject,
  body,
  followUp,
  leadId,
}: any) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  // -----------------------------
  // COPY FUNCTION
  // -----------------------------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      onOpenChange: function (open: boolean): void {
        throw new Error("Function not implemented.");
      },
      onAutoClose: function (): void {
        throw new Error("Function not implemented.");
      },
      onPause: function (): void {
        throw new Error("Function not implemented.");
      },
      onResume: function (): void {
        throw new Error("Function not implemented.");
      }
    });
  };

  // -----------------------------
  // SEND EMAIL FUNCTION
  // -----------------------------
  const handleSend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return toast({
        title: "Please login first",
        onOpenChange: function (open: boolean): void {
          throw new Error("Function not implemented.");
        },
        onAutoClose: function (): void {
          throw new Error("Function not implemented.");
        },
        onPause: function (): void {
          throw new Error("Function not implemented.");
        },
        onResume: function (): void {
          throw new Error("Function not implemented.");
        }
      });

      const token = await user.getIdToken();
      setIsSending(true);

      const payload = {
        leadId,
        subject,
        body,
      };

      const res = await axios.post("/api/sendEmail", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Email sent successfully 🎉",
        onOpenChange: function (open: boolean): void {
          throw new Error("Function not implemented.");
        },
        onAutoClose: function (): void {
          throw new Error("Function not implemented.");
        },
        onPause: function (): void {
          throw new Error("Function not implemented.");
        },
        onResume: function (): void {
          throw new Error("Function not implemented.");
        }
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Send failed",
        description: err?.response?.data?.error || "An error occurred",
        onOpenChange: function (open: boolean): void {
          throw new Error("Function not implemented.");
        },
        onAutoClose: function (): void {
          throw new Error("Function not implemented.");
        },
        onPause: function (): void {
          throw new Error("Function not implemented.");
        },
        onResume: function (): void {
          throw new Error("Function not implemented.");
        }
      });
    } finally {
      setIsSending(false);
    }
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

        {/* FOOTER */}
        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">

          {/* CLOSE BUTTON */}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {/* SEND BUTTON (ONLY FOR EMAIL TAB) */}
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-primary text-primary-foreground"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}