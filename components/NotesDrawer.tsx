/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function NotesDrawer({
  open,
  onClose,
  lead,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lead: any;
  user: any;
  onSaved?: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    try {
      setSaving(true);
      const token = await user.getIdToken();

      await axios.post(
        "/api/updateLeadNotes",
        {
          uid: user.uid,
          leadId: lead.id,
          notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Notes saved!");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog className="fixed inset-0 z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl" />

        <div className="fixed right-0 top-0 h-full w-[420px] bg-[#111214] border-l border-white/10 shadow-2xl">
          <div className="flex flex-col h-full">
            {/* HEADER */}
            <header className="px-6 py-5 border-b border-white/10 flex items-start justify-between">
              <div>
                <h1 className="text-xl text-white font-semibold">
                  {lead.name}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  {lead.company} — Notes
                </p>
              </div>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </header>

            {/* TEXT AREA */}
            <main className="flex-1 overflow-y-auto p-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-[70vh] bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your notes..."
              />
            </main>

            {/* FOOTER */}
            <footer className="px-6 py-4 border-t border-white/10 flex justify-end">
              <Button onClick={saveNotes} disabled={saving}>
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </footer>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
