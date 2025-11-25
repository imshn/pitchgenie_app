/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function ReplyAnalyzerDrawer({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: any;
}) {
  if (!data) return null;

  const badgeColor =
    data.sentiment === "interested"
      ? "text-green-400 bg-green-500/10 border-green-500/20"
      : data.sentiment === "positive"
        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
        : data.sentiment === "pricing_question"
          ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          : data.sentiment === "neutral"
            ? "text-gray-400 bg-gray-500/10 border-gray-500/20"
            : "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

        <div className="fixed right-0 top-0 h-full w-[480px] glass border-l border-border shadow-premium overflow-hidden flex flex-col">
          {/* Header */}
          <header className="sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">AI Reply Analysis</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Sentiment */}
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sentiment</h2>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border ${badgeColor}`}>
                {data.sentiment.replace(/_/g, " ").toUpperCase()}
              </span>
            </section>

            {/* Summary */}
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Summary</h2>
              <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed">
                {data.summary}
              </div>
            </section>

            {/* Recommended reply */}
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recommended Reply</h2>
              <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm whitespace-pre-wrap leading-relaxed">
                {data.reply}
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(data.reply);
                toast.success("Reply copied to clipboard");
              }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Reply
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150"
            >
              Close
            </button>
          </footer>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
