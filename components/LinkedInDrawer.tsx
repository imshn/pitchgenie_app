import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { X, Copy, Save } from 'lucide-react';
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";

export default function LinkedInDrawer({
  open,
  onClose,
  connect,
  followup,
  leadId,
}: {
  open: boolean;
  onClose: () => void;
  connect: string;
  followup: string;
  leadId?: string;
}) {
  const [editedContent, setEditedContent] = useState({
    connect: "",
    followup: "",
  });

  useEffect(() => {
    setEditedContent({
      connect: connect || "",
      followup: followup || "",
    });
  }, [connect, followup]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleSave = async () => {
    if (!leadId) return;
    try {
      await updateDoc(doc(db, "leads", leadId), {
        linkedinConnect: editedContent.connect,
        linkedinFollowup: editedContent.followup,
        updatedAt: Date.now(),
      });
      toast.success("Changes saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
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
              <h1 className="text-lg font-semibold text-foreground">LinkedIn Preview</h1>
              <p className="text-xs text-muted-foreground mt-1">Connection + Follow-up</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Content */}
          <main className="flex-1 px-6 py-6 overflow-y-auto space-y-6">
            <section>
              <label className="text-sm font-semibold text-foreground block mb-3">Connection Message</label>
              <Textarea
                value={editedContent.connect}
                onChange={(e) => setEditedContent({ ...editedContent, connect: e.target.value })}
                className="bg-secondary/40 min-h-[150px]"
              />
              <button 
                onClick={() => copy(editedContent.connect)}
                className="mt-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </section>

            <section>
              <label className="text-sm font-semibold text-foreground block mb-3">Follow-up</label>
              <Textarea
                value={editedContent.followup}
                onChange={(e) => setEditedContent({ ...editedContent, followup: e.target.value })}
                className="bg-secondary/40 min-h-[150px]"
              />
              <button 
                onClick={() => copy(editedContent.followup)}
                className="mt-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </section>
          </main>

          {/* Footer */}
          <footer className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-3">
            {leadId && (
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 ml-auto"
            >
              Close
            </button>
          </footer>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
