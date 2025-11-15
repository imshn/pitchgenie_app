/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import EmailPreviewDrawer from "./EmailPreviewDrawer";

export default function LeadTable({ user }: { user: any }) {
  const [leads, setLeads] = useState<any[]>([]);

  // Independent loading states
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const [loadingLinkedInId, setLoadingLinkedInId] = useState<string | null>(null);
  const [loadingSequenceId, setLoadingSequenceId] = useState<string | null>(null);

  // Preview Drawer
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const fetchLeads = async () => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("uid", "==", user.uid));
    const snap = await getDocs(q);
    setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  // -----------------------
  // EMAIL GENERATION
  // -----------------------
  const generateEmail = async (lead: any) => {
    try {
      setLoadingEmailId(lead.id);
      const token = await user.getIdToken();

      const res = await axios.post(
        "/api/generateEmail",
        {
          leadId: lead.id,
          uid: user.uid,
          name: lead.name,
          company: lead.company,
          role: lead.role,
          website: lead.website,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchLeads();

      setPreviewData({
        type: "email",
        subject: res.data.subject,
        body: res.data.body,
        followUp: res.data.followUp,
      });

      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Email generation failed");
    } finally {
      setLoadingEmailId(null);
    }
  };

  // -----------------------
  // LINKEDIN GENERATION
  // -----------------------
  const generateLinkedIn = async (lead: any) => {
    try {
      setLoadingLinkedInId(lead.id);
      const token = await user.getIdToken();

      const res = await axios.post(
        "/api/linkedinMessage",
        {
          uid: user.uid,
          leadId: lead.id,
          name: lead.name,
          role: lead.role,
          company: lead.company,
          website: lead.website,
          companySummary: lead.aiSummary || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPreviewData({
        type: "linkedin",
        connect: res.data.connect,
        followup: res.data.followup,
      });

      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("LinkedIn message failed");
    } finally {
      setLoadingLinkedInId(null);
    }
  };

  // -----------------------
  // SEQUENCE GENERATION
  // -----------------------
  const generateSequence = async (lead: any) => {
    try {
      setLoadingSequenceId(lead.id);
      const token = await user.getIdToken();

      const res = await axios.post(
        "/api/emailSequence",
        {
          uid: user.uid,
          leadId: lead.id,
          name: lead.name,
          role: lead.role,
          company: lead.company,
          website: lead.website,
          companySummary: lead.aiSummary || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPreviewData({
        type: "sequence",
        sequence: res.data,
      });

      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Sequence generation failed");
    } finally {
      setLoadingSequenceId(null);
    }
  };

  // -----------------------
  // PREVIEW EXISTING
  // -----------------------
  const previewExisting = (lead: any) => {
    setPreviewData({
      type: "email",
      subject: lead.subject || "",
      body: lead.body || "",
      followUp: lead.followUp || "",
    });
    setPreviewOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-300 bg-white/5">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-t border-white/10 hover:bg-white/5 relative"
              >
                <td className="px-4 py-4">{lead.name}</td>
                <td className="px-4 py-4 text-gray-300">{lead.company}</td>
                <td className="px-4 py-4 text-gray-300">{lead.role}</td>

                <td className="px-4 py-4">
                  {lead.subject ? (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                      Generated
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300">
                      Pending
                    </span>
                  )}
                </td>

                {/* ACTION BUTTONS */}
                <td className="px-4 py-4">
                  <div className="grid grid-cols-3 gap-2">

                    {/* EMAIL */}
                    {lead.subject ? (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewExisting(lead);
                        }}
                      >
                        Preview
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateEmail(lead);
                        }}
                        disabled={loadingEmailId === lead.id}
                      >
                        {loadingEmailId === lead.id ? "..." : "Email"}
                      </Button>
                    )}

                    {/* LINKEDIN */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateLinkedIn(lead);
                      }}
                      disabled={loadingLinkedInId === lead.id}
                    >
                      {loadingLinkedInId === lead.id ? "..." : "LinkedIn"}
                    </Button>

                    {/* SEQUENCE */}
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateSequence(lead);
                      }}
                      disabled={loadingSequenceId === lead.id}
                    >
                      {loadingSequenceId === lead.id ? "..." : "Sequence"}
                    </Button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DRAWER */}
      {previewData && (
        <EmailPreviewDrawer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          previewData={previewData}
          user={user}
        />
      )}
    </>
  );
}
