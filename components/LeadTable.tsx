/* eslint-disable @typescript-eslint/no-explicit-any */
/* components/LeadTable.tsx */
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import EmailPreviewDrawer from "./EmailPreviewDrawer";

export default function LeadTable() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const fetchLeads = async (uid?: string) => {
    if (!uid) return;
    const q = query(collection(db, "leads"), where("uid", "==", uid));
    const snap = await getDocs(q);
    setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return;
      await fetchLeads(u.uid);
    });
    return () => unsub();
  }, []);

  const callApiWithToken = async (path: string, body: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Login required");
    const token = await user.getIdToken();
    return axios.post(path, body, { headers: { Authorization: `Bearer ${token}` } });
  };

  const generateEmail = async (lead: any) => {
    try {
      setLoadingId(lead.id);
      const res = await callApiWithToken("/api/generateEmail", {
        leadId: lead.id,
        uid: auth.currentUser!.uid,
        name: lead.name,
        company: lead.company,
        role: lead.role,
        website: lead.website,
      });
      await fetchLeads(auth.currentUser!.uid);
      setPreviewData({ type: "email", subject: res.data.subject, body: res.data.body, followUp: res.data.followUp });
      setPreviewOpen(true);
      toast.success("Email generated");
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err.message || "Generation failed";
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

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
      setPreviewData({ type: "linkedin", connect: res.data.connect, followup: res.data.followup });
      setPreviewOpen(true);
      toast.success("LinkedIn messages ready");
    } catch (err: any) {
      console.error(err);
      toast.error("LinkedIn generation failed");
    } finally {
      setLoadingId(null);
    }
  };

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
      setPreviewData({ type: "sequence", sequence: res.data });
      setPreviewOpen(true);
      toast.success("Sequence generated");
      await fetchLeads(auth.currentUser!.uid);
    } catch (err: any) {
      console.error(err);
      toast.error("Sequence generation failed");
    } finally {
      setLoadingId(null);
    }
  };

  const previewExisting = (lead: any) => {
    setPreviewData({ type: "email", subject: lead.subject || "", body: lead.body || "", followUp: lead.followUp || "" });
    setPreviewOpen(true);
  };

  return (
    <>
      <div className="overflow-auto rounded-xl border border-white/8">
        <table className="w-full table-fixed">
          <thead className="bg-white/5 text-left text-gray-300">
            <tr>
              <th className="px-4 py-3 w-48">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 w-40">Status</th>
              <th className="px-4 py-3 w-64">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-white/6 hover:bg-white/3">
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3 text-gray-300">{lead.company}</td>
                <td className="px-4 py-3 text-gray-300">{lead.role}</td>
                <td className="px-4 py-3 text-gray-300">{lead.email || "—"}</td>
                <td className="px-4 py-3">
                  {lead.subject ? <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400">Generated</span> : <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300">Pending</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {lead.subject ? (
                      <button onClick={() => previewExisting(lead)} className="px-3 py-1 rounded-md bg-white/6">Preview</button>
                    ) : (
                      <button disabled={loadingId === lead.id} onClick={() => generateEmail(lead)} className="px-3 py-1 rounded-md bg-gradient-to-r from-purple-600 to-pink-500">
                        {loadingId === lead.id ? "Generating..." : "Generate"}
                      </button>
                    )}
                    <button disabled={loadingId === lead.id} onClick={() => generateLinkedIn(lead)} className="px-3 py-1 rounded-md bg-white/6">LinkedIn</button>
                    <button disabled={loadingId === lead.id} onClick={() => generateSequence(lead)} className="px-3 py-1 rounded-md bg-white/6">Sequence</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewData && <EmailPreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} previewData={previewData} />}
    </>
  );
}