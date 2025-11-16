/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";

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
      ? "text-green-400 bg-green-500/10"
      : data.sentiment === "positive"
      ? "text-blue-400 bg-blue-500/10"
      : data.sentiment === "pricing_question"
      ? "text-yellow-400 bg-yellow-500/10"
      : data.sentiment === "neutral"
      ? "text-gray-400 bg-gray-500/10"
      : "text-red-400 bg-red-500/10";

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        {/* backdrop */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl" />

        {/* drawer panel */}
        <div className="fixed right-0 top-0 h-full w-[450px] bg-[#111214] border-l border-white/10 shadow-xl">
          <div className="flex flex-col h-full">

            <header className="p-6 border-b border-white/10 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-white">AI Response Analyzer</h1>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Sentiment */}
              <section>
                <h2 className="text-sm text-gray-400">Sentiment</h2>
                <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs ${badgeColor}`}>
                  {data.sentiment}
                </span>
              </section>

              {/* Summary */}
              <section>
                <h2 className="text-sm text-gray-400 mb-2">Summary</h2>
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-gray-200 leading-6">
                  {data.summary}
                </div>
              </section>

              {/* Recommended reply */}
              <section>
                <h2 className="text-sm text-gray-400 mb-2">Recommended Reply</h2>
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-gray-200 whitespace-pre-wrap leading-6">
                  {data.reply}
                </div>
              </section>

            </main>

            <footer className="p-4 border-t border-white/10">
              <Button className="w-full" onClick={() => navigator.clipboard.writeText(data.reply)}>
                Copy Reply
              </Button>
            </footer>

          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
