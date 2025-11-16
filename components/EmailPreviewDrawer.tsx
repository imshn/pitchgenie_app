/* eslint-disable @typescript-eslint/no-explicit-any */
// components/EmailPreviewDrawer.tsx
"use client";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { auth } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";

export default function EmailPreviewDrawer({ open, onClose, previewData }: { open: boolean; onClose: () => void; previewData: any; }) {
  if (!previewData) return null;

  const handleSend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return toast.error("Login required");
      const token = await user.getIdToken();

      // previewData must contain leadId and subject/body when type=email
      const payload: any = {
        leadId: previewData.leadId || previewData?.lead?.id,
        to: previewData.to || previewData.lead?.email,
        subject: previewData.subject,
        body: previewData.body,
      };

      const res = await axios.post("/api/sendEmail", payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Email queued/sent");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Send failed");
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed right-0 top-0 h-full w-[520px] p-6 dark-glass overflow-y-auto">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-semibold">Preview</h3>
            <button onClick={onClose} className="text-gray-300">Close</button>
          </div>

          <div className="mt-6">
            {previewData.type === "email" && (
              <>
                <h4 className="font-semibold">Subject</h4>
                <div className="mt-2 p-4 bg-white/5 rounded-md">{previewData.subject || "No subject"}</div>

                <h4 className="font-semibold mt-4">Body</h4>
                <div className="mt-2 p-4 bg-white/5 rounded-md whitespace-pre-wrap">{previewData.body || "No body"}</div>

                <h4 className="font-semibold mt-4">Follow-up</h4>
                <div className="mt-2 p-4 bg-white/5 rounded-md whitespace-pre-wrap">{previewData.followUp || "No follow-up"}</div>
              </>
            )}

            {previewData.type === "sequence" && (
              <div>
                <h4 className="font-semibold">Sequence</h4>
                {Object.entries(previewData.sequence || {}).map(([k, v]: any) => (
                  <div key={k} className="mt-3">
                    <div className="text-sm text-gray-300 uppercase">{k}</div>
                    <div className="mt-1 p-3 bg-white/5 rounded-md whitespace-pre-wrap">{v}</div>
                  </div>
                ))}
              </div>
            )}

            {previewData.type === "linkedin" && (
              <div>
                <h4 className="font-semibold">LinkedIn Connect</h4>
                <div className="mt-2 p-4 bg-white/5 rounded-md whitespace-pre-wrap">{previewData.connect}</div>
                <h4 className="font-semibold mt-4">Follow-up</h4>
                <div className="mt-2 p-4 bg-white/5 rounded-md whitespace-pre-wrap">{previewData.followup}</div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 rounded-md bg-white/8" onClick={() => { navigator.clipboard.writeText((previewData.body || "") + "\n\n" + (previewData.followUp || "")); toast.success("Copied"); }}>Copy All</button>
            {previewData.type === "email" && <button className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500" onClick={handleSend}>Send</button>}
            <button className="px-4 py-2 rounded-md bg-white/6" onClick={onClose}>Close</button>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}