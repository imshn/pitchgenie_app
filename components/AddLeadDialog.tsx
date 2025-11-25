"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { addDoc, collection, getDocs, query, where, documentId } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import toast from "react-hot-toast";

interface AddLeadDialogProps {
  onLeadAdded?: () => void;
}

export default function AddLeadDialog({ onLeadAdded }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    website: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // 1. Get current workspace ID
      const userDoc = await getDocs(query(collection(db, "users"), where(documentId(), "==", auth.currentUser.uid)));
      if (userDoc.empty) throw new Error("User not found");

      const userData = userDoc.docs[0].data();
      const workspaceId = userData.currentWorkspaceId;

      if (!workspaceId) throw new Error("No workspace found");

      // 2. Add to workspace leads
      await addDoc(collection(db, "workspaces", workspaceId, "leads"), {
        uid: auth.currentUser.uid,
        ...formData,
        status: "new",
        createdAt: Date.now(),
        tags: [],
        workspaceId // Redundant but good for querying
      });
      toast.success("Lead added successfully");
      setOpen(false);
      setFormData({ name: "", email: "", company: "", role: "", website: "" });
      if (onLeadAdded) onLeadAdded();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" value={formData.company} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" name="role" value={formData.role} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
