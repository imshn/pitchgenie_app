/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import EmailPreviewDrawer from "./EmailPreviewDrawer";
import LinkedInDrawer from "./LinkedInDrawer";
import SequenceDrawer from "./SequenceDrawer";
import { Loader2 } from "lucide-react";

export default function LeadTable() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Drawers
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);
  const [previewLinkedIn, setPreviewLinkedIn] = useState<any | null>(null);
  const [previewSequence, setPreviewSequence] = useState<any | null>(null);

  // Fetch user’s leads
  const fetchLeads = async (uid?: string) => {
    if (!uid) return;
    const q = query(collection(db, "leads"), where("uid", "==", uid));
    const snap = await getDocs(q);
    console.log("Fetched leads:", snap.docs.map((d) => d.data()));
    setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // Listen to auth change
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return;
      await fetchLeads(u.uid);
    });
    return () => unsub();
  }, []);

  // Helper to call API with firebase token
  const callApiWithToken = async (path: string, body: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Login required");
    const token = await user.getIdToken();
    return axios.post(path, body, { headers: { Authorization: `Bearer ${token}` } });
  };

  // -----------------------------------------
  // EMAIL GENERATION
  // -----------------------------------------
  const generateEmail = async (lead: any) => {
    try {
      setLoadingId(lead.id);

      const res = await callApiWithToken("/api/generateEmail", {
        leadId: lead.id,
        uid: auth.currentUser!.uid,
        name: lead.name,
        company: lead.company,
        role: lead.role,
        email: lead.email,
        website: lead.website,
      });

      await fetchLeads(auth.currentUser!.uid);

      setPreviewEmail({
        type: "email",
        leadId: lead.id,
        subject: res.data.subject,
        body: res.data.body,
        followUp: res.data.followUp,
      });

      toast.success("Email generated");
    } catch (err: any) {
      console.error(err);
      toast.error("Email generation failed");
    } finally {
      setLoadingId(null);
    }
  };

  // -----------------------------------------
  // LINKEDIN MESSAGES
  // -----------------------------------------
  const generateLinkedIn = async (lead: any) => {
    try {
      setLoadingId(lead.id);

      const res = await callApiWithToken("/api/linkedinMessage", {
        leadId: lead.id,
        uid: auth.currentUser!.uid,
        name: lead.name,
        role: lead.role,
        company: lead.company,
        website: lead.website,
        companySummary: lead.aiSummary || "",
      });

      setPreviewLinkedIn({
        connect: res.data.connect,
        followup: res.data.followup,
      });

      toast.success("LinkedIn messages generated");
    } catch (err) {
      console.error(err);
      toast.error("LinkedIn generation failed");
    } finally {
      setLoadingId(null);
    }
  };

  // -----------------------------------------
  // EMAIL SEQUENCE
  // -----------------------------------------
  const generateSequence = async (lead: any) => {
    try {
      setLoadingId(lead.id);

      const res = await callApiWithToken("/api/emailSequence", {
        leadId: lead.id,
        uid: auth.currentUser!.uid,
        name: lead.name,
        role: lead.role,
        company: lead.company,
        website: lead.website,
        companySummary: lead.aiSummary || "",
      });

      setPreviewSequence(res.data);

      toast.success("Email sequence generated");
      await fetchLeads(auth.currentUser!.uid);
    } catch (err) {
      console.error(err);
      toast.error("Sequence generation failed");
    } finally {
      setLoadingId(null);
    }
  };

  // -----------------------------------------
  // PREVIEW EXISTING EMAIL
  // -----------------------------------------
  const previewExisting = (lead: any) => {
    setPreviewEmail({
      type: "email",
      leadId: lead.id,
      subject: lead.subject || "",
      body: lead.body || "",
      followUp: lead.followUp || "",
    });
  };

  // -----------------------------------------
  // UI BELOW (UNCHANGED AS REQUESTED)
  // -----------------------------------------

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden shadow-premium">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Company</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Website</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-secondary/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm text-foreground font-medium">{lead.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{lead.company}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{lead.role}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{lead.email || "—"}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{lead.website || "—"}</td>
                <td className="px-6 py-4 text-sm">
                  {lead.subject ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium text-xs">
                      Generated
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-border font-medium text-xs">
                      Pending
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {lead.subject ? (
                      <button
                        onClick={() => previewExisting(lead)}
                        className="px-3 py-2 rounded-md text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary transition-colors duration-150 border border-border"
                      >
                        Preview
                      </button>
                    ) : (
                      <button
                        disabled={loadingId === lead.id}
                        onClick={() => generateEmail(lead)}
                        className="px-3 py-2 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors duration-150 border border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingId === lead.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate"
                        )}
                      </button>
                    )}

                    <button
                      disabled={loadingId === lead.id}
                      onClick={() => generateLinkedIn(lead)}
                      className="px-3 py-2 rounded-md text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary transition-colors duration-150 border border-border"
                    >
                      LinkedIn
                    </button>

                    <button
                      disabled={loadingId === lead.id}
                      onClick={() => generateSequence(lead)}
                      className="px-3 py-2 rounded-md text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary transition-colors duration-150 border border-border"
                    >
                      Sequence
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Drawer */}
      {previewEmail && (
        <EmailPreviewDrawer
          open={!!previewEmail}
          onClose={() => setPreviewEmail(null)}
          previewData={previewEmail}
        />
      )}

      {/* LinkedIn Drawer */}
      {previewLinkedIn && (
        <LinkedInDrawer
          open={!!previewLinkedIn}
          onClose={() => setPreviewLinkedIn(null)}
          connect={previewLinkedIn.connect}
          followup={previewLinkedIn.followup}
        />
      )}

      {/* Sequence Drawer */}
      {previewSequence && (
        <SequenceDrawer
          open={!!previewSequence}
          onClose={() => setPreviewSequence(null)}
          sequence={previewSequence}
          user={ auth.currentUser }
        /> 
      )}
    </>
  );
}