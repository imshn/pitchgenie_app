/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import toast from "react-hot-toast";
import TemplateDrawer from "./TemplateDrawer";

export default function EmailPreviewDrawer({
  open,
  onClose,
  previewData,
  user,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  previewData: any;
  user: any;
  lead: any;
}) {
  const [subject, setSubject] = useState(previewData.subject || "");
  const [body, setBody] = useState(previewData.body || "");
  const [follow, setFollow] = useState(previewData.followUp || "");

  const [templateDrawer, setTemplateDrawer] = useState(false);
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);
  const [deliverability, setDeliverability] = useState<any>(null);

  // Load templates
  const openTemplateDrawer = async () => {
    try {
      const token = await user.getIdToken();
      const res = await axios.get("/api/getTemplates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTemplateList(res.data.templates);
      setTemplateDrawer(true);
    } catch (err) {
      toast.error("Could not load templates");
    }
  };

  // Apply template
  const applyTemplate = (tpl: any) => {
    let newBody = tpl.body || "";
    let newSubject = tpl.subject || "";
    const newFollow = tpl.followUp || "";

    // Replace placeholders using lead data
    newBody = newBody
      .replace(/{{name}}/g, lead.name)
      .replace(/{{company}}/g, lead.company)
      .replace(/{{role}}/g, lead.role);

    newSubject = newSubject.replace(/{{name}}/g, lead.name);

    setBody(newBody);
    setSubject(newSubject);
    setFollow(newFollow);

    setTemplateDrawer(false);
    toast.success("Template applied");
  };

  // Save Template
  const saveTemplate = async () => {
    try {
      const title = window.prompt("Template name:");
      if (!title) return;

      const token = await user.getIdToken();
      await axios.post(
        "/api/saveTemplate",
        {
          uid: user.uid,
          title,
          subject,
          body,
          followUp: follow,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Template saved");
    } catch {
      toast.error("Failed to save template");
    }
  };

  // Send email
  const sendEmail = async () => {
    try {
      const token = await user.getIdToken();
      await axios.post(
        "/api/sendEmail",
        {
          uid: user.uid,
          leadId: lead.id,
          subject,
          body,
          followUp: follow,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Email sent");
    } catch (err) {
      toast.error("Send failed");
    }
  };

  // Deliverability Check
  const checkDeliverability = async () => {
    try {
      setChecking(true);
      const token = await user.getIdToken();

      const res = await axios.post(
        "/api/deliverabilityCheck",
        {
          uid: user.uid,
          subject,
          body,
          followUp: follow,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeliverability(res.data);
      toast.success("Scored");
    } catch (err) {
      console.error(err);
      toast.error("Check failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl" />

        <div className="fixed right-0 top-0 h-full w-[500px] bg-[#121316] border-l border-white/10 shadow-2xl p-6 overflow-y-auto">

          <h2 className="text-xl font-semibold mb-4">
            {previewData.type === "sequence"
              ? "Email Sequence"
              : previewData.type === "linkedin"
              ? "LinkedIn Messages"
              : "Generated Email"}
          </h2>

          {/* SUBJECT */}
          {previewData.type === "email" && (
            <div className="mb-6">
              <label className="text-sm text-gray-400">Subject</label>
              <input
                className="w-full bg-white/5 border border-white/10 p-2 rounded-lg text-gray-200 mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* BODY */}
          <div className="mb-6">
            <label className="text-sm text-gray-400">Body</label>
            <textarea
              className="w-full min-h-[180px] bg-white/5 border border-white/10 p-3 rounded-lg text-gray-200 mt-1"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* FOLLOW UP */}
          {previewData.type === "email" && (
            <div className="mb-6">
              <label className="text-sm text-gray-400">Follow-up</label>
              <textarea
                className="w-full min-h-[120px] bg-white/5 border border-white/10 p-3 rounded-lg text-gray-200 mt-1"
                value={follow}
                onChange={(e) => setFollow(e.target.value)}
              />
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col gap-3">
            <Button onClick={sendEmail} className="w-full bg-purple-600">
              Send Email
            </Button>

            <Button
              variant="outline"
              onClick={checkDeliverability}
              className="w-full"
              disabled={checking}
            >
              {checking ? "Checking..." : "Check Deliverability"}
            </Button>

            <Button variant="outline" onClick={openTemplateDrawer}>
              Apply Template
            </Button>

            <Button variant="outline" onClick={saveTemplate}>
              Save as Template
            </Button>

            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Deliverability Score */}
          {deliverability && (
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <h3 className="text-gray-300 font-semibold mb-2">
                Deliverability Score:
              </h3>
              <p className="text-purple-300 text-2xl">{deliverability.score}/100</p>
              <p className="text-gray-400 mt-2">{deliverability.notes}</p>
            </div>
          )}
        </div>

        {/* TEMPLATE DRAWER */}
        <TemplateDrawer
          open={templateDrawer}
          onClose={() => setTemplateDrawer(false)}
          templates={templateList}
          onSelect={applyTemplate}
        />
      </Dialog>
    </Transition.Root>
  );
}
