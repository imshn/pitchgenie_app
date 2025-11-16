/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import EmailPreviewDrawer from "./EmailPreviewDrawer";
import NotesDrawer from "./NotesDrawer";
import ReplyAnalyzerDrawer from "./ReplyAnalyzerDrawer";

export default function LeadTable({ user }: { user: any }) {
  const [leads, setLeads] = useState<any[]>([]);

  // loading states per action
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const [loadingLinkedInId, setLoadingLinkedInId] = useState<string | null>(null);
  const [loadingSequenceId, setLoadingSequenceId] = useState<string | null>(null);

  // preview / drawers
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [currentLead, setCurrentLead] = useState<any | null>(null);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesLead, setNotesLead] = useState<any | null>(null);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyData, setReplyData] = useState<any | null>(null);

  // search & filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generatedFilter, setGeneratedFilter] = useState("all");

  // persona + industry
  const [persona, setPersona] = useState("");
  const [industry, setIndustry] = useState("");

  const statuses = [
    { key: "none", label: "No Status", color: "bg-gray-600/30 text-gray-300" },
    { key: "contacted", label: "Contacted", color: "bg-blue-600/20 text-blue-400" },
    { key: "replied", label: "Replied", color: "bg-green-600/20 text-green-400" },
    { key: "hot", label: "Hot Lead", color: "bg-red-600/20 text-red-400" },
    { key: "not_interested", label: "Not Interested", color: "bg-gray-300/20 text-gray-400" },
  ];

  // fetch leads for current user
  const fetchLeads = async () => {
    try {
      if (!user?.uid) return;
      const q = query(collection(db, "leads"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("fetchLeads error", err);
      toast.error("Failed to load leads");
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // GENERATE EMAIL
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
          persona,
          industry,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchLeads();

      setCurrentLead(lead);
      setPreviewData({
        type: "email",
        subject: res.data.subject,
        body: res.data.body,
        followUp: res.data.followUp,
      });
      setPreviewOpen(true);
    } catch (err) {
      console.error("generateEmail err", err);
      toast.error("Email generation failed");
    } finally {
      setLoadingEmailId(null);
    }
  };

  // GENERATE LINKEDIN
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
          persona,
          industry,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentLead(lead);
      setPreviewData({
        type: "linkedin",
        connect: res.data.connect,
        followup: res.data.followup,
      });
      setPreviewOpen(true);
    } catch (err) {
      console.error("generateLinkedIn err", err);
      toast.error("LinkedIn generation failed");
    } finally {
      setLoadingLinkedInId(null);
    }
  };

  // GENERATE SEQUENCE
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
          persona,
          industry,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentLead(lead);
      setPreviewData({
        type: "sequence",
        sequence: res.data,
      });
      setPreviewOpen(true);
    } catch (err) {
      console.error("generateSequence err", err);
      toast.error("Sequence generation failed");
    } finally {
      setLoadingSequenceId(null);
    }
  };

  // PREVIEW existing generated email
  const previewExisting = (lead: any) => {
    setCurrentLead(lead);
    setPreviewData({
      type: "email",
      subject: lead.subject || "",
      body: lead.body || "",
      followUp: lead.followUp || "",
    });
    setPreviewOpen(true);
  };

  // OPEN notes drawer
  const openNotesDrawer = (lead: any) => {
    setNotesLead(lead);
    setNotesOpen(true);
  };

  // ANALYZE REPLY (opens prompt, sends to API)
  const analyzeReply = async () => {
    try {
      const replyText = window.prompt("Paste the lead's reply here:");
      if (!replyText) return;

      const token = await user.getIdToken();
      const res = await axios.post(
        "/api/analyzeReply",
        { uid: user.uid, replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReplyData(res.data);
      setReplyOpen(true);
    } catch (err) {
      console.error("analyzeReply err", err);
      toast.error("Failed to analyze reply");
    }
  };

  // CLIENT CSV download (selected = filteredLeads here)
  const downloadCsv = (rows: any[], filename = "leads.csv") => {
    if (!rows.length) {
      toast("No leads to export");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys
          .map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // FILTER logic
  const filteredLeads = leads.filter((lead) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.company || "").toLowerCase().includes(q) ||
      (lead.role || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" ? true : (lead.status || "none") === statusFilter;

    const generated = Boolean(lead.subject);
    const matchesGenerated =
      generatedFilter === "all"
        ? true
        : generatedFilter === "generated"
        ? generated
        : !generated;

    return matchesSearch && matchesStatus && matchesGenerated;
  });

  return (
    <>
      {/* Controls: Persona + Industry */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-200 px-3 py-2 text-sm rounded-lg"
        >
          <option value="">Default Persona</option>
          <option value="founder">Founder Tone</option>
          <option value="sales_rep">Sales Representative</option>
          <option value="consultant">Consultant Tone</option>
          <option value="friendly">Friendly</option>
          <option value="short_direct">Short & Direct</option>
          <option value="humorous">Humorous</option>
          <option value="corporate">Corporate / Polished</option>
        </select>

        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-200 px-3 py-2 text-sm rounded-lg"
        >
          <option value="">General Industry</option>
          <option value="saas">SaaS</option>
          <option value="agency">Marketing Agency</option>
          <option value="real_estate">Real Estate</option>
          <option value="ecommerce">E-commerce</option>
          <option value="coaching">Coaching / Consulting</option>
          <option value="it_services">IT / Dev Services</option>
          <option value="healthcare">Healthcare</option>
          <option value="education">Education</option>
          <option value="fintech">Fintech</option>
          <option value="crypto">Crypto / Web3</option>
          <option value="local_business">Local Business</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name, company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 w-[260px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-200 px-3 py-2 text-sm rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="none">No Status</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="hot">Hot</option>
            <option value="not_interested">Not Interested</option>
          </select>

          <select
            value={generatedFilter}
            onChange={(e) => setGeneratedFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-200 px-3 py-2 text-sm rounded-lg"
          >
            <option value="all">All</option>
            <option value="generated">Generated</option>
            <option value="pending">Pending</option>
          </select>

          <Button onClick={() => downloadCsv(filteredLeads)}>Export CSV</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-300 bg-white/5">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="px-4 py-4">{lead.name}</td>
                <td className="px-4 py-4 text-gray-300">{lead.company}</td>
                <td className="px-4 py-4 text-gray-300">{lead.role}</td>
                <td className="px-4 py-4 text-gray-300">{lead.email}</td>

                <td className="px-4 py-4">
                  <span className="px-3 py-1 rounded-full text-xs bg-gray-600/20">
                    {lead.status || "none"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="grid grid-cols-5 gap-2">

                    {/* Email */}
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

                    {/* LinkedIn */}
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

                    {/* Sequence */}
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateSequence(lead);
                      }}
                      disabled={loadingSequenceId === lead.id}
                    >
                      {loadingSequenceId === lead.id ? "..." : "Seq"}
                    </Button>

                    {/* Notes */}
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNotesDrawer(lead);
                      }}
                    >
                      Notes
                    </Button>

                    {/* Analyze Reply */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzeReply();
                      }}
                    >
                      Analyze
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No leads match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawers */}
      {previewData && currentLead && (
        <EmailPreviewDrawer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          previewData={previewData}
          user={user}
          lead={currentLead}
        />
      )}

      {notesLead && (
        <NotesDrawer
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          lead={notesLead}
          user={user}
          onSaved={fetchLeads}
        />
      )}

      {replyData && (
        <ReplyAnalyzerDrawer
          open={replyOpen}
          onClose={() => {
            setReplyOpen(false);
            setReplyData(null);
          }}
          data={replyData}
        />
      )}
    </>
  );
}
