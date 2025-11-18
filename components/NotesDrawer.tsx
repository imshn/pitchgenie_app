/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Save } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

        <div className="fixed right-0 top-0 h-full w-[420px] glass border-l border-border shadow-premium overflow-hidden flex flex-col">
          
          {/* Header */}
          <header className="sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {lead.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {lead.company} — Notes
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-full bg-secondary/40 border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150"
              placeholder="Write your notes..."
            />
          </main>

          {/* Footer */}
          <footer className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-3">
            <button 
              onClick={saveNotes}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Notes"}
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
