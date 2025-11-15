/* eslint-disable @typescript-eslint/no-explicit-any */
// components/EmailPreviewDrawer.tsx
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

import SequenceDrawer from "./SequenceDrawer";
import LinkedInDrawer from "./LinkedInDrawer";

type PreviewData =
  | { type: "email"; subject: string; body: string; followUp: string }
  | { type: "linkedin"; connect: string; followup: string }
  | { type: "sequence"; sequence: Record<string, string> }
  | null;

export default function EmailPreviewDrawer({
  open,
  onClose,
  previewData,
  user, // firebase user passed from parent (LeadTable)
}: {
  open: boolean;
  onClose: () => void;
  previewData: PreviewData;
  user: any;
}) {
  // Guard
  if (!previewData) return null;

  // Route to sequence or linkedin drawer modes
  if (previewData.type === "sequence") {
  return (
    <SequenceDrawer
      open={open}
      onClose={onClose}
      sequence={previewData.sequence}
      user={user}
    />
  );
}

  if (previewData.type === "linkedin") {
    return (
      <LinkedInDrawer
        open={open}
        onClose={onClose}
        connect={previewData.connect}
        followup={previewData.followup}
      />
    );
  }

  // email mode
  const { subject, body, followUp } = previewData;

  const saveAsTemplate = async () => {
    if (!previewData || previewData.type !== "email") {
      toast.error("Templates can only be saved from Email Preview.");
      return;
    }

    try {
      const token = await user.getIdToken();

      const subject = previewData.subject || "Untitled Template";
      const body = previewData.body || "";
      const followUp = previewData.followUp || "";

      const fullPrompt = `${subject}\n\n${body}\n\nFollow-up:\n${followUp}`;

      const res = await axios.post(
        "/api/createTemplate",
        {
          uid: user.uid,
          title: subject,
          prompt: fullPrompt,
          type: "email",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Template saved!");
      console.log("Saved template:", res.data);
    } catch (error: any) {
      console.error("Save template error:", error);
      toast.error("Error saving template");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const downloadTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
  <Transition.Root show={open} as={Fragment}>
    <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
      
      {/* BACKDROP */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xl transition-opacity" />

      {/* PANEL */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-[#111214] border-l border-white/10 shadow-2xl">
        <div className="flex flex-col h-full">

          {/* HEADER */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">{subject}</h1>
              <p className="text-xs text-gray-400 mt-1">Cold Email Preview</p>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            
            {/* SUBJECT */}
            <section>
              <h2 className="text-sm font-semibold text-gray-300 mb-2">Subject</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-gray-100">
                {subject}
              </div>
            </section>

            {/* BODY */}
            <section>
              <h2 className="text-sm font-semibold text-gray-300 mb-2">Email Body</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 whitespace-pre-wrap text-gray-100 leading-6">
                {body}
              </div>

              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={() => copyToClipboard(body)}>Copy Body</Button>
                <Button variant="outline" onClick={() => downloadTxt("body.txt", body)}>Download</Button>
              </div>
            </section>

            {/* FOLLOW-UP */}
            <section>
              <h2 className="text-sm font-semibold text-gray-300 mb-2">Follow-up</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 whitespace-pre-wrap text-gray-100 leading-6">
                {followUp}
              </div>

              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={() => copyToClipboard(followUp)}>Copy Follow-up</Button>
                <Button variant="outline" onClick={() => downloadTxt("followup.txt", followUp)}>Download</Button>
              </div>
            </section>

          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">Actions</div>
            <div className="flex gap-3">
              <Button onClick={() => copyToClipboard(`${subject}\n\n${body}`)}>Copy All</Button>
              <Button onClick={() => downloadTxt("email_full.txt", `${subject}\n\n${body}\n\nFollow-up:\n${followUp}`)}>
                Download All
              </Button>

              {/* Save Template only for emails */}
              {previewData.type === "email" && (
                <Button variant="secondary" onClick={saveAsTemplate}>
                  Save Template
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </Dialog>
  </Transition.Root>
);

}
