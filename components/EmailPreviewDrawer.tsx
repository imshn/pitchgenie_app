/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { auth } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Copy, Send } from 'lucide-react';

export default function EmailPreviewDrawer({ open, onClose, previewData }: { open: boolean; onClose: () => void; previewData: any; }) {
  if (!previewData) return null;

  const handleSend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return toast.error("Login required");
      const token = await user.getIdToken();

      const payload: any = {
        leadId: previewData.leadId || previewData?.lead?.id,
        to: previewData.to || previewData.lead?.email,
        subject: previewData.subject,
        body: previewData.body,
      };

      const res = await axios.post("/api/sendEmail", payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Email queued/sent");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Send failed");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
        
        <div className="fixed right-0 top-0 h-full w-[520px] glass border-l border-border overflow-y-auto shadow-premium">
          {/* Header */}
          <div className="sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Preview</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {previewData.type === "email" && (
              <>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Subject</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed">
                    {previewData.subject || "No subject"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Body</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {previewData.body || "No body"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Follow-up</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {previewData.followUp || "No follow-up"}
                  </div>
                </div>
              </>
            )}

            {previewData.type === "sequence" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Sequence</h3>
                {Object.entries(previewData.sequence || {}).map(([k, v]: any) => (
                  <div key={k}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{k}</div>
                    <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewData.type === "linkedin" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">LinkedIn Connect</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {previewData.connect}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Follow-up</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {previewData.followup}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-3">
            <button 
              onClick={() => { 
                navigator.clipboard.writeText((previewData.body || "") + "\n\n" + (previewData.followUp || "")); 
                toast.success("Copied to clipboard");
              }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            {previewData.type === "email" && (
              <button 
                onClick={handleSend}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
