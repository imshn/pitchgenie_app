/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";

import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Mail, Zap } from "lucide-react";

import EmailPreviewModal from "@/components/EmailPreviewModal";
import EmailPreviewDrawer from "./EmailPreviewDrawer";

export default function LeadTable({ user }: any) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchLeads = () => {
    setLoading(true);
    const q = query(collection(db, "leads"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLeads(list);
      setLoading(false);
    });
    return unsubscribe;
  };

  useEffect(() => {
    if (user) {
      const unsubscribe = fetchLeads();
      return () => unsubscribe();
    }
  }, [user]);

  const generateEmail = async (lead: any) => {
    try {
      setLoadingId(lead.id);
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
      setPreviewData(res.data);
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      alert("Error generating email");
    } finally {
      setLoadingId(null);
    }
  };

  const generateLinkedIn = async (lead: any) => {
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

    setPreviewData(res.data);
    setPreviewOpen(true);
  };

  const generateAll = async () => {
    const notGenerated = leads.filter((l) => !l.subject);
    if (notGenerated.length === 0) {
      alert("All leads already have generated emails!");
      return;
    }

    setBulkLoading(true);
    setBulkProgress(0);
    const token = await user.getIdToken();

    for (let i = 0; i < notGenerated.length; i++) {
      const lead = notGenerated[i];
      try {
        await axios.post(
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
        setBulkProgress(i + 1);
      } catch (err) {
        console.error("Bulk generation error:", err);
      }
    }

    setBulkLoading(false);
    alert("Bulk generation complete!");
  };

  useEffect(() => {
    const btn = document.getElementById("bulk-generate-btn");
    if (btn) {
      btn.onclick = generateAll;
    }
  }, [leads, user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No leads found!</AlertTitle>
        <AlertDescription>
          Upload a CSV file with your leads to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {bulkLoading && (
        <div className="mb-4 text-sm text-muted-foreground">
          Generating... {bulkProgress}/{leads.filter((l) => !l.subject).length}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.company}</TableCell>
                <TableCell>{lead.role}</TableCell>
                <TableCell>
                  {lead.subject ? (
                    <Badge variant="success">Generated</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => generateLinkedIn(lead)}
                    className="rounded-full bg-blue-500/20 hover:bg-blue-500/30"
                  >
                    LinkedIn
                  </Button>
                  {lead.subject ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPreviewData(lead);
                        setPreviewOpen(true);
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => generateEmail(lead)}
                      disabled={loadingId === lead.id}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      {loadingId === lead.id ? "Generating..." : "Generate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {previewOpen && previewData && (
        <EmailPreviewDrawer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          subject={previewData?.subject}
          body={previewData?.body}
          followUp={previewData?.followUp}
        />
      )}
    </>
  );
}
