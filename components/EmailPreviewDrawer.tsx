import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { auth, db } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Copy, Send, User, Building2, Globe, Mail as MailIcon, Save, Loader2 } from 'lucide-react';
import { LeadNotes } from "./crm/LeadNotes";
import { TagChip } from "./crm/TagChip";
import { TagInput } from "./crm/TagInput";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EmailPreviewDrawer({ open, onClose, previewData }: { open: boolean; onClose: () => void; previewData: any; }) {
  // Local state for tags
  const [localTags, setLocalTags] = useState<string[]>([]);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Local state for editing email content
  const [editedContent, setEditedContent] = useState({
    subject: "",
    body: "",
    followUp: "",
  });

  useEffect(() => {
    if (previewData) {
      setLocalTags(previewData.lead?.tags || []);
      setEditedContent({
        subject: previewData.subject || "",
        body: previewData.body || "",
        followUp: previewData.followUp || "",
      });
    }
  }, [previewData]);

  if (!previewData) return null;

  const handleSave = async () => {
    if (!previewData.leadId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "leads", previewData.leadId), {
        subject: editedContent.subject,
        body: editedContent.body,
        followUp: editedContent.followUp,
        updatedAt: Date.now(),
      });
      toast.success("Changes saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Login required");
        return;
      }
      const token = await user.getIdToken();

      const payload: any = {
        leadId: previewData.leadId || previewData?.lead?.id,
        to: previewData.to || previewData.lead?.email,
        subject: editedContent.subject,
        body: editedContent.body,
      };

      const res = await axios.post("/api/sendEmail", payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Email queued/sent");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Send failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!previewData.lead?.id) return;
    try {
      const newTags = [...localTags, tag];
      setLocalTags(newTags); // Optimistic
      await updateDoc(doc(db, "leads", previewData.lead.id), {
        tags: arrayUnion(tag)
      });
      toast.success("Tag added");
    } catch (error) {
      setLocalTags(localTags); // Revert
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!previewData.lead?.id) return;
    try {
      const newTags = localTags.filter(t => t !== tag);
      setLocalTags(newTags); // Optimistic
      await updateDoc(doc(db, "leads", previewData.lead.id), {
        tags: arrayRemove(tag)
      });
      toast.success("Tag removed");
    } catch (error) {
      setLocalTags(localTags); // Revert
      toast.error("Failed to remove tag");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

        <div className="fixed right-0 top-0 h-full w-[520px] glass border-l border-border overflow-y-auto shadow-premium">
          {/* Header */}
          <div className="sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-foreground">
              {previewData.type === 'details' ? 'Lead Details' : 'Preview & Edit'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {previewData.type === "details" && previewData.lead && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {previewData.lead.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{previewData.lead.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{previewData.lead.company}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-foreground">{previewData.lead.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={previewData.lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                        {previewData.lead.website}
                      </a>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                      <MailIcon className="h-4 w-4" />
                      <span className="text-foreground">{previewData.lead.email}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Tags */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {localTags.map(tag => (
                      <TagChip key={tag} tag={tag} onRemove={handleRemoveTag} />
                    ))}
                    <TagInput onAddTag={handleAddTag} />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Notes */}
                <LeadNotes
                  leadId={previewData.lead.id}
                  initialNotes={previewData.lead.notes || ""}
                  updatedAt={previewData.lead.notesUpdatedAt}
                />
              </div>
            )}

            {previewData.type === "email" && (
              <>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Subject</label>
                  <Input
                    value={editedContent.subject}
                    onChange={(e) => setEditedContent({ ...editedContent, subject: e.target.value })}
                    className="bg-secondary/40"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Body</label>
                  <Textarea
                    value={editedContent.body}
                    onChange={(e) => setEditedContent({ ...editedContent, body: e.target.value })}
                    className="bg-secondary/40 min-h-[200px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Follow-up</label>
                  <Textarea
                    value={editedContent.followUp}
                    onChange={(e) => setEditedContent({ ...editedContent, followUp: e.target.value })}
                    className="bg-secondary/40 min-h-[100px]"
                  />
                </div>
              </>
            )}

            {previewData.type === "sequence" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Sequence</h3>
                {Object.entries(previewData.sequence || {}).map(([k, v]: any) => (
                  <div key={k}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{k}</div>
                    <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewData.type === "linkedin" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">LinkedIn Connect</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {previewData.connect}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Follow-up</label>
                  <div className="p-4 bg-secondary/40 border border-border rounded-lg text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {previewData.followup}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex gap-3">
            {previewData.type !== 'details' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText((editedContent.body || "") + "\n\n" + (editedContent.followUp || ""));
                  toast.success("Copied to clipboard");
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            )}

            {previewData.type === "email" && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? "Sending..." : "Send"}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
