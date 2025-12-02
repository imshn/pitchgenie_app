"use client";

import { Mail, Phone, Globe, Share2, Code, FileText, Copy, Check, Plus, ExternalLink, User, Link as LinkIcon, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ScrapeResult } from "@/lib/scraper/types";
import { motion } from "framer-motion";
import { AddToLeadsModal } from "./AddToLeadsModal";
import { ResultCard } from "./ResultCard";
import { QuickActionsBar } from "./QuickActionsBar";
import { RawDataViewer } from "./RawDataViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface ScraperResultsProps {
    data: ScrapeResult;
    onGenerateEmail: () => void;
    onPreviewEmail: () => void;
    onSendEmail: () => void;
    generatingEmail: boolean;
    emailGenerated: boolean;
    sendingEmail: boolean;
    industry?: string;
}

export function ScraperResults({
    data,
    onGenerateEmail,
    onPreviewEmail,
    onSendEmail,
    generatingEmail,
    emailGenerated,
    sendingEmail,
    industry
}: ScraperResultsProps) {
    const [showLeadModal, setShowLeadModal] = useState(false);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `scrape-${new URL(data.url).hostname}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported successfully");
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return "bg-green-500/10 text-green-500 border-green-500/20";
        if (score >= 50) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        return "bg-red-500/10 text-red-500 border-red-500/20";
    };

    return (
        <>
            <QuickActionsBar
                onAddToLeads={() => setShowLeadModal(true)}
                onExport={handleExport}
                onCopyLink={() => handleCopy(data.url, "URL")}
                onGenerateEmail={onGenerateEmail}
                onPreviewEmail={onPreviewEmail}
                onSendEmail={onSendEmail}
                generatingEmail={generatingEmail}
                emailGenerated={emailGenerated}
                sendingEmail={sendingEmail}
            />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {/* Main Info Card */}
                <motion.div variants={item} className="md:col-span-3">
                    <ResultCard
                        title="Home"
                        icon={Globe}
                        iconColor="text-blue-500"
                        action={
                            <Badge variant="outline" className={`font-mono ${getScoreColor(data.meta.confidenceScore)}`}>
                                Score: {data.meta.confidenceScore}
                            </Badge>
                        }
                    >
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden border border-border/50 shadow-lg shrink-0 bg-muted/20 flex items-center justify-center">
                                {data.image ? (
                                    <Image
                                        unoptimized
                                        width={1920}
                                        height={1080}
                                        src={data.image}
                                        alt="Website Preview"
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            // Fallback to thum.io if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            if (!target.src.includes('thum.io')) {
                                                target.src = `https://image.thum.io/get/width/1200/crop/600/${encodeURIComponent(data.url)}`;
                                            } else {
                                                // If thum.io also fails, hide the image
                                                target.style.display = 'none';
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Globe className="h-8 w-8" />
                                        <span className="text-xs">No preview</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3 flex-1">
                                <div>
                                    <a href={data.url} target="_blank" rel="noreferrer" className="text-xl font-semibold hover:underline flex items-center gap-2 group">
                                        {data.title || data.url}
                                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                    </a>
                                    <p className="text-sm text-muted-foreground mt-1">{data.url}</p>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground/90">
                                    {data.description || "No description available."}
                                </p>

                                {/* AI Insight Tags */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {data.techStack.length > 0 && (
                                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
                                            Tech-Savvy
                                        </Badge>
                                    )}
                                    {data.team.length > 0 && (
                                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20">
                                            Team Detected
                                        </Badge>
                                    )}
                                    {industry && (
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
                                            {industry}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ResultCard>
                </motion.div>

                {/* Contacts */}
                <motion.div variants={item} className="md:col-span-1">
                    <ResultCard
                        title="Contacts"
                        icon={Mail}
                        iconColor="text-purple-500"
                        action={
                            data.emails.length > 0 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(data.emails.join(", "), "Emails")}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            )
                        }
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Emails</p>
                                {data.emails.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.emails.map((email, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
                                                <span className="text-sm font-mono truncate">{email}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(email, "Email")}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No emails found</p>
                                )}
                            </div>

                            {data.phones.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Phones</p>
                                    <div className="space-y-2">
                                        {data.phones.map((phone, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span>{phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ResultCard>
                </motion.div>

                {/* Tech Stack */}
                <motion.div variants={item} className="md:col-span-1">
                    <ResultCard title="Tech Stack" icon={Code} iconColor="text-cyan-500">
                        {data.techStack.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.techStack.map((tech, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="bg-cyan-950/30 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 hover:scale-105 transition-all cursor-default"
                                    >
                                        {tech}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No technologies detected</p>
                        )}
                    </ResultCard>
                </motion.div>

                {/* Socials */}
                <motion.div variants={item} className="md:col-span-1">
                    <ResultCard title="Socials" icon={Share2} iconColor="text-pink-500">
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(data.socials).map(([platform, url]) => (
                                <a
                                    key={platform}
                                    href={url as string}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all group"
                                >
                                    <Globe className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-sm capitalize truncate">{platform}</span>
                                    <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            ))}
                            {Object.keys(data.socials).length === 0 && (
                                <p className="text-sm text-muted-foreground italic col-span-2">No social profiles found</p>
                            )}
                        </div>
                    </ResultCard>
                </motion.div>

                {/* Team Members */}
                <motion.div variants={item} className="md:col-span-3">
                    <ResultCard
                        title={`Team Members (${data.team.length})`}
                        icon={User}
                        iconColor="text-orange-500"
                        defaultOpen={data.team.length > 0}
                    >
                        {data.team && data.team.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {data.team.map((member, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all group">
                                        {member.image ? (
                                            <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold ring-2 ring-border group-hover:ring-primary/50 transition-all">
                                                {member.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="overflow-hidden min-w-0">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors" title={member.name}>{member.name}</p>
                                            {member.role && <p className="text-xs text-muted-foreground truncate" title={member.role}>{member.role}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">No team members detected</div>
                        )}
                    </ResultCard>
                </motion.div>

                {/* Links */}
                {data.links && data.links.length > 0 && (
                    <motion.div variants={item} className="md:col-span-3">
                        <ResultCard title="Quick Links" icon={LinkIcon} iconColor="text-indigo-500" defaultOpen={false}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {data.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-muted-foreground hover:text-primary truncate block p-2 rounded hover:bg-muted/50 transition-colors"
                                    >
                                        {link.text}
                                    </a>
                                ))}
                            </div>
                        </ResultCard>
                    </motion.div>
                )}

                {/* Page Content */}
                <motion.div variants={item} className="md:col-span-3">
                    <ResultCard title="Page Content" icon={FileText} iconColor="text-blue-500" defaultOpen={false}>
                        <div className="text-sm text-muted-foreground leading-relaxed p-3 bg-muted/20 rounded-lg border border-border/30 max-h-96 overflow-y-auto">
                            {data.content ? (
                                <pre className="whitespace-pre-wrap font-sans">{data.content}</pre>
                            ) : (
                                <p className="italic">No content extracted</p>
                            )}
                        </div>
                    </ResultCard>
                </motion.div>

                {/* Summary */}
                <motion.div variants={item} className="md:col-span-3">
                    <ResultCard title="AI Summary" icon={FileText} iconColor="text-green-500">
                        <div className="text-sm text-muted-foreground leading-relaxed p-2 bg-muted/20 rounded-lg border border-border/30">
                            {data.summary || "No summary available."}
                        </div>
                    </ResultCard>
                </motion.div>
            </motion.div>

            <RawDataViewer data={data} />

            <AddToLeadsModal
                open={showLeadModal}
                onOpenChange={setShowLeadModal}
                data={{
                    email: data.emails[0],
                    company: data.title || undefined,
                    website: data.url,
                    linkedin: data.socials.linkedin,
                    summary: data.summary || undefined
                }}
                team={data.team}
            />
        </>
    );
}
