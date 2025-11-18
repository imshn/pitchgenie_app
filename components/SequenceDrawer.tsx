/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Save } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

        <div className="fixed right-0 top-0 h-full w-[480px] glass border-l border-border shadow-premium overflow-hidden flex flex-col">
          
          {/* Header */}
          <header className="sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Email Sequence</h1>
              <p className="text-xs text-muted-foreground mt-1">3–5 Step Sequence</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {Object.entries(sequence).map(([key, value], index) => (
              <section key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 border border-primary/30">
                    <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
                    {key}
                  </h2>
                </div>
                <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {value}
                </div>
              </section>
            ))}
          </main>

          {/* Footer */}
          <footer className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-3">
            <button 
              onClick={saveSequenceTemplate}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Template
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
