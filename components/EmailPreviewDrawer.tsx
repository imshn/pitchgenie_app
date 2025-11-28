import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { auth, db } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Copy, Send, User, Building2, Globe, Mail as MailIcon, Save, Loader2, Shield, CheckCircle, AlertCircle, FilePlus, Minus, Plus } from 'lucide-react';
import { LeadNotes } from "./crm/LeadNotes";
import { TagChip } from "./crm/TagChip";
import { TagInput } from "./crm/TagInput";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createDiff } from "@/lib/textDiff";

import { StatusModal } from "@/components/ui/StatusModal";

export default function EmailPreviewDrawer({ open, onClose, previewData, workspaceId }: { open: boolean; onClose: () => void; previewData: any; workspaceId: string | null; }) {
  // Local state for tags
  const [localTags, setLocalTags] = useState<string[]>([]);

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showStatus = (type: "success" | "error" | "warning", title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCheckingDeliverability, setIsCheckingDeliverability] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Deliverability check state
  const [deliverabilityResult, setDeliverabilityResult] = useState<any>(null);
  const [showDeliverability, setShowDeliverability] = useState(false);

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
      // Reset deliverability when new email is loaded
      setDeliverabilityResult(null);
      setShowDeliverability(false);
    }
  }, [previewData]);

  if (!previewData) return null;

  const handleSave = async () => {
    if (!previewData.leadId || !workspaceId) {
      if (!workspaceId) showStatus("error", "Error", "Workspace not found");
      return;
    }
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "workspaces", workspaceId, "leads", previewData.leadId), {
        subject: editedContent.subject,
        body: editedContent.body,
        followUp: editedContent.followUp,
        updatedAt: Date.now(),
      });
      showStatus("success", "Saved", "Changes saved successfully");
    } catch (error) {
      console.error(error);
      showStatus("error", "Error", "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("error", "Auth Error", "Login required");
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
      showStatus("success", "Sent", "Email queued/sent successfully");
      // Don't close immediately so user sees success modal
      // onClose(); 
    } catch (err: any) {
      console.error(err);
      showStatus("error", "Send Failed", err?.response?.data?.error || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckDeliverability = async () => {
    setIsCheckingDeliverability(true);
    setShowDeliverability(false); // Hide any previous results
    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("error", "Auth Error", "Login required");
        return;
      }
      const token = await user.getIdToken();

      const res = await axios.post(
        "/api/deliverabilityCheck",
        {
          uid: user.uid,
          subject: editedContent.subject,
          body: editedContent.body,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeliverabilityResult(res.data);
      setShowDeliverability(true);

      // Scroll to results panel after a brief delay
      setTimeout(() => {
        const resultsPanel = document.querySelector('[data-deliverability-results]');
        if (resultsPanel) {
          resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);

      // toast.success(`Deliverability Score: ${res.data.score}/100`);
    } catch (err: any) {
      console.error(err);
      showStatus("error", "Check Failed", err?.response?.data?.error || "Deliverability check failed");
    } finally {
      setIsCheckingDeliverability(false);
    }
  };

  const applyDeliverabilityImprovements = () => {
    if (!deliverabilityResult) return;
    setEditedContent({
      subject: deliverabilityResult.subject || editedContent.subject,
      body: deliverabilityResult.body || editedContent.body,
      followUp: editedContent.followUp,
    });
    showStatus("success", "Applied", "Improvements applied successfully!");
    setShowDeliverability(false);
  };

  const handleSaveAsTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("error", "Auth Error", "Login required");
        return;
      }
      const token = await user.getIdToken();

      await axios.post(
        "/api/saveTemplate",
        {
          title: `Template - ${new Date().toLocaleDateString()}`,
          subject: editedContent.subject,
          body: editedContent.body,
          followUp: editedContent.followUp,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showStatus("success", "Saved", "Saved as template successfully!");
    } catch (err: any) {
      console.error(err);
      showStatus("error", "Error", err?.response?.data?.error || "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!previewData.lead?.id || !workspaceId) return;
    try {
      const newTags = [...localTags, tag];
      setLocalTags(newTags); // Optimistic
      await updateDoc(doc(db, "workspaces", workspaceId, "leads", previewData.lead.id), {
        tags: arrayUnion(tag)
      });
      // toast.success("Tag added"); // Optional: maybe too noisy for modal? Let's keep toast for minor actions or remove
    } catch (error) {
      setLocalTags(localTags); // Revert
      showStatus("error", "Error", "Failed to add tag");
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!previewData.lead?.id || !workspaceId) return;
    try {
      const newTags = localTags.filter(t => t !== tag);
      setLocalTags(newTags); // Optimistic
      await updateDoc(doc(db, "workspaces", workspaceId, "leads", previewData.lead.id), {
        tags: arrayRemove(tag)
      });
      // toast.success("Tag removed");
    } catch (error) {
      setLocalTags(localTags); // Revert
      showStatus("error", "Error", "Failed to remove tag");
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

                {/* Deliverability Check Section */}
                {showDeliverability && deliverabilityResult && (
                  <div
                    data-deliverability-results
                    className="p-5 bg-secondary/40 border-2 border-primary/30 rounded-lg space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Deliverability Analysis Results
                      </h3>
                      <button
                        onClick={() => setShowDeliverability(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scores Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/50 rounded-lg border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Original Score</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${(deliverabilityResult.original_score ?? 60) >= 80
                                ? 'bg-green-500'
                                : (deliverabilityResult.original_score ?? 60) >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                                }`}
                              style={{ width: `${deliverabilityResult.original_score ?? 60}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {deliverabilityResult.original_score ?? 60}/100
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="text-xs text-muted-foreground mb-1">Improved Score</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all bg-green-500"
                              style={{ width: `${deliverabilityResult.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {deliverabilityResult.score}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Issues Found */}
                    {deliverabilityResult.issues_found && deliverabilityResult.issues_found.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Issues Identified
                        </div>
                        <ul className="space-y-1 text-xs text-foreground">
                          {deliverabilityResult.issues_found.map((issue: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Spam Words */}
                    {deliverabilityResult.spam_words && deliverabilityResult.spam_words.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Spam Trigger Words
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {deliverabilityResult.spam_words.map((word: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Changes Made */}
                    {deliverabilityResult.changes_made && deliverabilityResult.changes_made.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Improvements Applied
                        </div>
                        <ul className="space-y-1 text-xs text-foreground">
                          {deliverabilityResult.changes_made.map((change: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* GitHub-Style Diff View */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">Changes Comparison</div>

                      {/* Subject Diff */}
                      <div className="mb-3">
                        <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Subject</div>
                        <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                          {createDiff(editedContent.subject, deliverabilityResult.subject).map((line, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-1 text-xs font-mono flex items-start gap-2 ${line.type === 'remove'
                                ? 'bg-red-500/10 text-red-400'
                                : line.type === 'add'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'text-muted-foreground'
                                }`}
                            >
                              <span className="select-none w-4 text-center shrink-0">
                                {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                              </span>
                              <span className="break-all">{line.text || ' '}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Body Diff */}
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Body</div>
                        <div className="border border-border rounded-lg overflow-hidden bg-background/50 max-h-48 overflow-y-auto">
                          {createDiff(editedContent.body, deliverabilityResult.body).map((line, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-1 text-[11px] font-mono flex items-start gap-2 ${line.type === 'remove'
                                ? 'bg-red-500/10 text-red-400'
                                : line.type === 'add'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'text-muted-foreground'
                                }`}
                            >
                              <span className="select-none w-4 text-center shrink-0 mt-0.5">
                                {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                              </span>
                              <span className="break-words whitespace-pre-wrap flex-1">{line.text || ' '}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setShowDeliverability(false);
                          toast.success("Improvements dismissed");
                        }}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150"
                      >
                        Deny Improvements
                      </button>
                      <button
                        onClick={applyDeliverabilityImprovements}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Apply Changes
                      </button>
                    </div>
                  </div>
                )}
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
          <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4">
            {previewData.type !== 'details' && (
              <div className="flex items-center gap-2">
                {/* Secondary Actions - Icon only with tooltips */}
                <div className="flex items-center gap-1 mr-auto">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText((editedContent.body || "") + "\n\n" + (editedContent.followUp || ""));
                      toast.success("Copied to clipboard");
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {previewData.type === "email" && (
                  <>
                    {/* Utility Actions */}
                    <button
                      onClick={handleCheckDeliverability}
                      disabled={isCheckingDeliverability}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Check email deliverability"
                    >
                      {isCheckingDeliverability ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Check</span>
                    </button>
                    <button
                      onClick={handleSaveAsTemplate}
                      disabled={isSavingTemplate}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save as template"
                    >
                      {isSavingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Template</span>
                    </button>

                    {/* Save Changes */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>

                    {/* Primary Action - Send */}
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm hover:shadow transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </>
                )}
              </div>
            )}

            {previewData.type === 'details' && (
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </Dialog>
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </Transition.Root>
  );
}
