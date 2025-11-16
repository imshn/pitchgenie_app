/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function SequenceDrawer({
  open,
  onClose,
  sequence,
  user,
}: {
  open: boolean;
  onClose: () => void;
  sequence: Record<string, string>;
  user: any;
}) {
  if (!sequence) return null;

  const saveSequenceTemplate = async () => {
    try {
      const token = await user.getIdToken();

      const formatted = Object.entries(sequence)
        .map(([k, v]) => `${k.toUpperCase()}:\n${v}\n`)
        .join("\n");

      await axios.post(
        "/api/createTemplate",
        {
          uid: user.uid,
          title: "Sequence Template",
          prompt: formatted,
          type: "sequence",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Sequence template saved!");
    } catch {
      toast.error("Save failed");
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
                <h1 className="text-xl text-white font-semibold">Email Sequence</h1>
                <p className="text-xs text-gray-400 mt-1">3–5 Step Sequence</p>
              </div>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </header>

            {/* CONTENT */}
            <main className="flex-1 px-6 py-6 overflow-y-auto space-y-8">
              {Object.entries(sequence).map(([key, value]) => (
                <section key={key}>
                  <h2 className="text-sm text-purple-300 font-semibold uppercase mb-2">
                    {key}
                  </h2>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 whitespace-pre-wrap leading-6">
                    {value}
                  </div>
                </section>
              ))}
            </main>

            {/* FOOTER */}
            <footer className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-gray-400">Actions</span>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={saveSequenceTemplate}>
                  Save Template
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </footer>

          </div>
        </div>

      </Dialog>
    </Transition.Root>
  );
}
