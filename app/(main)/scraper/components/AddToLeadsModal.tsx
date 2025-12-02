"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { TeamMember } from "@/lib/scraper/types";

interface AddToLeadsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: {
        email?: string;
        company?: string;
        website?: string;
        linkedin?: string;
        summary?: string;
    };
    team?: TeamMember[];
}

export function AddToLeadsModal({ open, onOpenChange, data, team = [] }: AddToLeadsModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedPersonId, setSelectedPersonId] = useState<string>("custom");

    const [formData, setFormData] = useState({
        email: data.email || "",
        firstName: "",
        lastName: "",
        company: data.company || "",
        website: data.website || "",
        linkedin: data.linkedin || "",
        notes: data.summary ? `Imported from Scraper.\n\nSummary:\n${data.summary}` : ""
    });

    // Reset form when data changes
    useEffect(() => {
        if (open) {
            setFormData(prev => ({
                ...prev,
                email: data.email || prev.email,
                company: data.company || prev.company,
                website: data.website || prev.website,
                linkedin: data.linkedin || prev.linkedin,
                notes: data.summary ? `Imported from Scraper.\n\nSummary:\n${data.summary}` : prev.notes
            }));
            setSelectedPersonId("custom"); // Reset selected person when modal opens or data changes
        }
    }, [open, data]);

    const handlePersonChange = (value: string) => {
        setSelectedPersonId(value);
        if (value === "custom") {
            // Reset to default scraper data
            setFormData(prev => ({
                ...prev,
                firstName: "",
                lastName: "",
                linkedin: data.linkedin || "",
                email: data.email || ""
            }));
        } else {
            const person = team[parseInt(value)];
            if (person) {
                const names = person.name.split(" ");
                setFormData(prev => ({
                    ...prev,
                    firstName: names[0] || "",
                    lastName: names.slice(1).join(" ") || "",
                    linkedin: person.socials.linkedin || prev.linkedin,
                    // We don't have email for person usually, so keep existing or clear?
                    // Keep existing email as fallback or clear if we want strict person data.
                    // Usually scraper gets generic emails. Let's keep it but maybe user wants to find specific email.
                    email: prev.email
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post("/api/leads/create", formData);
            toast.success("Lead added successfully!");
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add lead");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add to Leads</DialogTitle>
                    <DialogDescription>
                        Review and edit the details before adding to your leads.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {team.length > 0 && (
                        <div className="space-y-2">
                            <Label>Select Person (Optional)</Label>
                            <Select value={selectedPersonId} onValueChange={handlePersonChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a team member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">
                                        <span className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Custom / Generic
                                        </span>
                                    </SelectItem>
                                    {team.map((member, idx) => (
                                        <SelectItem key={idx} value={idx.toString()}>
                                            {member.name} {member.role ? `(${member.role})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                            id="company"
                            placeholder="Acme Inc."
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes..."
                            className="h-24"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Lead
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
