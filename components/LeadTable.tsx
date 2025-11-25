/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  documentId,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import EmailPreviewDrawer from "./EmailPreviewDrawer";
import LinkedInDrawer from "./LinkedInDrawer";
import SequenceDrawer from "./SequenceDrawer";
import AddLeadDialog from "./AddLeadDialog";
import ReplyAnalyzerDrawer from "./ReplyAnalyzerDrawer";
import ReplyInputDialog from "./ReplyInputDialog";
import { Loader2, MoreHorizontal, Mail, Linkedin, Repeat, LayoutGrid, Table as TableIcon, Search, Filter, Plus, X, FileText, Download, MessageSquare, ChevronDown, FileSpreadsheet, StickyNote } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PipelineBoard } from "./crm/PipelineBoard";
import { TagChip } from "./crm/TagChip";
import { TagInput } from "./crm/TagInput";

export default function LeadTable() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<{ leadId: string; action: string } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // Drawers
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);
  const [previewLinkedIn, setPreviewLinkedIn] = useState<any | null>(null);
  const [previewSequence, setPreviewSequence] = useState<any | null>(null);
  const [replyAnalyzerData, setReplyAnalyzerData] = useState<any | null>(null);
  const [showReplyInput, setShowReplyInput] = useState(false);

  // -----------------------------------------
  // FETCH LEADS
  // -----------------------------------------
  // -----------------------------------------
  // FETCH LEADS
  // -----------------------------------------
  const fetchLeads = async (uid?: string) => {
    if (!uid) return;

    try {
      // 1. Get current workspace ID
      const userDoc = await getDocs(query(collection(db, "users"), where(documentId(), "==", uid)));
      if (userDoc.empty) return;

      const userData = userDoc.docs[0].data();
      const workspaceId = userData.currentWorkspaceId;

      if (!workspaceId) {
        console.warn("No workspace ID found for user");
        return;
      }

      // 2. Query workspace leads
      const q = query(collection(db, "workspaces", workspaceId, "leads"));
      const snap = await getDocs(q);

      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return;
      await fetchLeads(u.uid);
    });
    return () => unsub();
  }, []);

  // -----------------------------------------
  // HELPER: API CALL WITH TOKEN
  // -----------------------------------------
  const callApiWithToken = async (path: string, body: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Login required");

    const token = await user.getIdToken();
    return axios.post(path, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // -----------------------------------------
  // STATUS COLORS
  // -----------------------------------------
  const statusMap: any = {
    new: { label: "New", variant: "secondary" },
    contacted: { label: "Contacted", variant: "default" },
    replied: { label: "Replied", variant: "success" },
    hot: { label: "Hot", variant: "destructive" },
    not_interested: { label: "Not Interested", variant: "outline" },
  };

  // -----------------------------------------
  // UPDATE STATUS
  // -----------------------------------------
  const updateStatus = async (leadId: string, newStatus: string) => {
    // Optimistic Update
    const previousLeads = [...leads];
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      const ref = doc(db, "leads", leadId);
      await updateDoc(ref, { status: newStatus });
      toast.success(`Status updated`);
    } catch (err) {
      console.error(err);
      setLeads(previousLeads); // Revert
      toast.error("Failed to update status");
    }
  };

  // -----------------------------------------
  // TAG MANAGEMENT
  // -----------------------------------------
  const handleAddTag = async (leadId: string, tag: string) => {
    const previousLeads = [...leads];
    setLeads(leads.map(l => {
      if (l.id === leadId) {
        const currentTags = l.tags || [];
        if (currentTags.includes(tag)) return l;
        return { ...l, tags: [...currentTags, tag] };
      }
      return l;
    }));

    try {
      await updateDoc(doc(db, "leads", leadId), {
        tags: arrayUnion(tag)
      });
      toast.success("Tag added");
    } catch (error) {
      setLeads(previousLeads);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (leadId: string, tag: string) => {
    const previousLeads = [...leads];
    setLeads(leads.map(l => {
      if (l.id === leadId) {
        return { ...l, tags: (l.tags || []).filter((t: string) => t !== tag) };
      }
      return l;
    }));

    try {
      await updateDoc(doc(db, "leads", leadId), {
        tags: arrayRemove(tag)
      });
      toast.success("Tag removed");
    } catch (error) {
      setLeads(previousLeads);
      toast.error("Failed to remove tag");
    }
  };

  // -----------------------------------------
  // EXPORT LEADS - SERVER SIDE CSV
  // -----------------------------------------
  const handleExportCSV = async () => {
    if (filteredLeads.length === 0) {
      toast.error("No leads to export");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Login required");
        return;
      }

      const token = await user.getIdToken();
      const url = `/api/exportCsv?token=${encodeURIComponent(token)}&uid=${user.uid}`;

      // Trigger download
      window.open(url, '_blank');
      toast.success("CSV export started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  // -----------------------------------------
  // EXPORT TO NOTION
  // -----------------------------------------
  const handleExportToNotion = async (leadId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Login required");
        return;
      }

      const token = await user.getIdToken();
      const res = await axios.post(
        "/api/exportToNotion",
        { uid: user.uid, leadId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Lead exported to Notion!");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.error || "Failed to export to Notion";

      if (errorMsg.includes("not configured")) {
        toast.error("Notion not configured. Add NOTION_TOKEN and NOTION_PARENT_PAGE_ID to your environment variables.");
      } else {
        toast.error(errorMsg);
      }
    }
  };

  // -----------------------------------------
  // EMAIL GENERATION
  // -----------------------------------------
  const generateEmail = async (lead: any) => {
    try {
      setLoadingAction({ leadId: lead.id, action: 'email' });

      const res = await callApiWithToken("/api/generateEmail", {
        leadId: lead.id,
        uid: auth.currentUser!.uid,
        name: lead.name,
        company: lead.company,
        role: lead.role,
        email: lead.email,
        website: lead.website,
      });

      await updateStatus(lead.id, "contacted"); // AUTO-SET STATUS

      setPreviewEmail({
        type: "email",
        leadId: lead.id,
        subject: res.data.subject,
        body: res.data.body,
        followUp: res.data.followUp,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Email generation failed");
    } finally {
      setLoadingAction(null);
    }
  };

  // -----------------------------------------
  // LINKEDIN
  // -----------------------------------------
  const generateLinkedIn = async (lead: any) => {
    try {
      setLoadingAction({ leadId: lead.id, action: 'linkedin' });

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

      toast.success("LinkedIn messages ready");
    } catch (err) {
      console.error(err);
      toast.error("LinkedIn generation failed");
    } finally {
      setLoadingAction(null);
    }
  };

  // -----------------------------------------
  // SEQUENCE
  // -----------------------------------------
  const generateSequence = async (lead: any) => {
    try {
      setLoadingAction({ leadId: lead.id, action: 'sequence' });

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
    } catch (err) {
      console.error(err);
      toast.error("Sequence generation failed");
    } finally {
      setLoadingAction(null);
    }
  };

  // -----------------------------------------
  // ANALYZE REPLY
  // -----------------------------------------
  const analyzeReply = async (replyText: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Login required");

      const token = await user.getIdToken();
      const res = await axios.post(
        "/api/analyzeReply",
        {
          uid: user.uid,
          replyText,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReplyAnalyzerData(res.data);
      setShowReplyInput(false);
      toast.success("Reply analyzed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Reply analysis failed");
    }
  };

  // -----------------------------------------
  // FILTER LOGIC
  // -----------------------------------------
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    leads.forEach(l => l.tags?.forEach((t: string) => tags.add(t)));
    return Array.from(tags);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        lead.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || (lead.status || "new") === statusFilter;
      const matchesTag = tagFilter === "all" || (lead.tags || []).includes(tagFilter);

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [leads, searchQuery, statusFilter, tagFilter]);

  // -----------------------------------------
  // UI
  // -----------------------------------------
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 flex-wrap">
          <div className="relative flex-1 md:max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusMap).map(([key, val]: [string, any]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.error("Bulk Notion export coming soon. Use individual lead export for now.")}
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Export to Notion (Bulk)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddLeadDialog onLeadAdded={() => fetchLeads(auth.currentUser?.uid)} />

          <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border ml-2">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button
              variant={viewMode === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("pipeline")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell>{lead.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {lead.tags?.map((tag: string) => (
                        <TagChip
                          key={tag}
                          tag={tag}
                          onRemove={(t) => handleRemoveTag(lead.id, t)}
                          className="text-[10px] h-5 px-1.5"
                        />
                      ))}
                      <TagInput
                        onAddTag={(t) => handleAddTag(lead.id, t)}
                        placeholder="+"
                        className="w-16"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant={statusMap[lead.status || "new"]?.variant || "secondary"}
                          className="cursor-pointer hover:opacity-80"
                        >
                          {statusMap[lead.status || "new"]?.label || "New"}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(statusMap).map(([key, val]: [string, any]) => (
                          <DropdownMenuItem key={key} onClick={() => updateStatus(lead.id, key)}>
                            {val.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lead.notes && (
                        <div className="group relative">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="absolute bottom-full right-0 mb-2 hidden w-48 rounded bg-popover p-2 text-xs shadow-md group-hover:block z-50 border border-border">
                            <p className="line-clamp-3">{lead.notes}</p>
                          </div>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loadingAction?.leadId === lead.id}>
                            <span className="sr-only">Open menu</span>
                            {loadingAction?.leadId === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setPreviewEmail({ type: 'details', lead })}>
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground" data-tour="ai-buttons">Generate</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              generateEmail(lead);
                            }}
                            disabled={loadingAction?.leadId === lead.id && loadingAction?.action === 'email'}
                          >
                            {loadingAction?.leadId === lead.id && loadingAction?.action === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                            Generate Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              generateLinkedIn(lead);
                            }}
                            disabled={loadingAction?.leadId === lead.id && loadingAction?.action === 'linkedin'}
                          >
                            {loadingAction?.leadId === lead.id && loadingAction?.action === 'linkedin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Linkedin className="mr-2 h-4 w-4" />}
                            Generate LinkedIn
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              generateSequence(lead);
                            }}
                            disabled={loadingAction?.leadId === lead.id && loadingAction?.action === 'sequence'}
                          >
                            {loadingAction?.leadId === lead.id && loadingAction?.action === 'sequence' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
                            Generate Sequence
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Tools</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setShowReplyInput(true)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Analyze Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportToNotion(lead.id)}>
                            <StickyNote className="mr-2 h-4 w-4" />
                            Export to Notion
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Preview & Edit</DropdownMenuLabel>
                          <DropdownMenuItem
                            disabled={!lead.subject}
                            onClick={() => setPreviewEmail({
                              type: "email",
                              leadId: lead.id,
                              subject: lead.subject,
                              body: lead.body,
                              followUp: lead.followUp,
                            })}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Preview Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!lead.linkedinConnect}
                            onClick={() => setPreviewLinkedIn({
                              connect: lead.linkedinConnect,
                              followup: lead.linkedinFollowup,
                              leadId: lead.id,
                            })}
                          >
                            <Linkedin className="mr-2 h-4 w-4" />
                            Preview LinkedIn
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!lead.sequence}
                            onClick={() => setPreviewSequence({
                              ...lead.sequence,
                              leadId: lead.id,
                            })}
                          >
                            <Repeat className="mr-2 h-4 w-4" />
                            Preview Sequence
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No leads found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="h-[calc(100vh-220px)] overflow-hidden">
          <PipelineBoard
            leads={filteredLeads}
            onDragEnd={updateStatus}
            onViewLead={(lead) => setPreviewEmail({ type: 'details', lead })}
          />
        </div>
      )}

      {/* Drawers */}
      {previewEmail && (
        <EmailPreviewDrawer
          open={!!previewEmail}
          onClose={() => setPreviewEmail(null)}
          previewData={previewEmail}
        />
      )}
      {previewLinkedIn && (
        <LinkedInDrawer
          open={!!previewLinkedIn}
          onClose={() => setPreviewLinkedIn(null)}
          connect={previewLinkedIn.connect}
          followup={previewLinkedIn.followup}
          leadId={previewLinkedIn.leadId}
        />
      )}
      {previewSequence && (
        <SequenceDrawer
          open={!!previewSequence}
          onClose={() => setPreviewSequence(null)}
          sequence={previewSequence}
          user={auth.currentUser}
          leadId={previewSequence.leadId}
        />
      )}
      {replyAnalyzerData && (
        <ReplyAnalyzerDrawer
          open={!!replyAnalyzerData}
          onClose={() => setReplyAnalyzerData(null)}
          data={replyAnalyzerData}
        />
      )}
      <ReplyInputDialog
        open={showReplyInput}
        onClose={() => setShowReplyInput(false)}
        onAnalyze={analyzeReply}
        isLoading={loadingAction !== null}
      />
    </div>
  );
}
