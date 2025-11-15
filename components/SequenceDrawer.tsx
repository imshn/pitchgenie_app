/* eslint-disable @typescript-eslint/no-explicit-any */
// components/SequenceDrawer.tsx
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";

export default function SequenceDrawer({
  open,
  onClose,
  sequence,
  user, // REQUIRED for saving template
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

      // Convert sequence object to a formatted string
      const formatted = Object.entries(sequence)
        .map(([key, value]) => `${key.toUpperCase()}:\n${value}\n`)
        .join("\n");

      const res = await axios.post(
        "/api/createTemplate",
        {
          uid: user.uid,
          title: "Email Sequence Template",
          prompt: formatted,
          type: "sequence",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Sequence template saved!");
      console.log("Sequence template saved:", res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error saving template");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog className="fixed inset-0 z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        <div className="fixed right-0 top-0 h-full w-[480px] bg-[#0F1115] border-l border-white/6 p-6 overflow-y-auto">
          <h1 className="text-xl font-bold mb-6">Email Sequence</h1>

          {/* Sequence Steps */}
          {Object.entries(sequence).map(([key, value]: any) => (
            <div key={key} className="mb-6">
              <h2 className="text-sm text-purple-300 font-semibold uppercase mb-2">
                {key}
              </h2>
              <div className="text-sm text-white/80 whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/10">
                {value}
              </div>
            </div>
          ))}

          {/* Save Template Button */}
          <Button
            className="w-full mt-6"
            variant="secondary"
            onClick={saveSequenceTemplate}
          >
            Save Sequence Template
          </Button>

          {/* Close Button */}
          <Button className="w-full mt-3" onClick={onClose}>
            Close
          </Button>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
