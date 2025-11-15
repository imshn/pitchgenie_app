// components/LinkedInDrawer.tsx
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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

  if (!open) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog className="fixed inset-0 z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed right-0 top-0 h-full w-[480px] bg-[#0F1115] border-l border-white/6 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">LinkedIn Message</h3>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>

          <section className="mb-6">
            <h4 className="text-sm text-gray-300 mb-2">Connect (short)</h4>
            <div className="whitespace-pre-wrap bg-white/5 p-4 rounded-xl text-sm text-white/80">{connect || "No data"}</div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => copy(connect || "")}>Copy</Button>
            </div>
          </section>

          <section>
            <h4 className="text-sm text-gray-300 mb-2">Follow-up</h4>
            <div className="whitespace-pre-wrap bg-white/5 p-4 rounded-xl text-sm text-white/80">{followup || "No data"}</div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => copy(followup || "")}>Copy</Button>
            </div>
          </section>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
