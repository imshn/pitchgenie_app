"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function LinkedInDrawer({
  open,
  onClose,
  connect,
  followup,
}: {
  open: boolean;
  onClose: () => void;
  connect: string;
  followup: string;
}) {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog className="fixed inset-0 z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl" />

        <div className="fixed right-0 top-0 h-full w-[480px] bg-[#111214] border-l border-white/10 shadow-2xl">
          <div className="flex flex-col h-full">

            {/* HEADER */}
            <header className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h1 className="text-xl text-white font-semibold">LinkedIn Preview</h1>
                <p className="text-xs text-gray-400 mt-1">Connection + Follow-up</p>
              </div>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </header>

            {/* CONTENT */}
            <main className="flex-1 px-6 py-6 overflow-y-auto space-y-8">

              {/* Connect message */}
              <section>
                <h2 className="text-sm font-semibold text-gray-300 mb-2">Connection Message</h2>
                <div className="bg-white/5 border border-white/10 text-gray-200 rounded-xl p-4 whitespace-pre-wrap leading-6">
                  {connect || "No data"}
                </div>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => copy(connect)}>Copy</Button>
                </div>
              </section>

              {/* Follow-up */}
              <section>
                <h2 className="text-sm font-semibold text-gray-300 mb-2">Follow-up</h2>
                <div className="bg-white/5 border border-white/10 text-gray-200 rounded-xl p-4 whitespace-pre-wrap leading-6">
                  {followup || "No data"}
                </div>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => copy(followup)}>Copy</Button>
                </div>
              </section>

            </main>

            {/* FOOTER */}
            <footer className="px-6 py-4 border-t border-white/10 flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </footer>

          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
