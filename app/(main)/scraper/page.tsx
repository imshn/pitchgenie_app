"use client";

import { useState, useEffect } from "react";
import { ScraperInput } from "./components/ScraperInput";
import { ScraperResults } from "./components/ScraperResults";
import { ScraperHistory } from "./components/ScraperHistory";
import { EmailModal } from "./components/EmailModal";
import { ScrapeResult, ScrapeHistoryItem } from "@/lib/scraper/types";
import { toast } from "react-hot-toast";
import axios from "axios";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export default function ScraperPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ScrapeResult | null>(null);
    const [showHistory, setShowHistory] = useState(true);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState<{ email: string; subject: string } | null>(null);
    const [generatingEmail, setGeneratingEmail] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

    // Persist currentHistoryId to localStorage
    useEffect(() => {
        if (currentHistoryId) {
            localStorage.setItem("lastScrapeId", currentHistoryId);
        }
    }, [currentHistoryId]);

    // Restore state from localStorage on mount
    useEffect(() => {
        const restoreState = async () => {
            const lastId = localStorage.getItem("lastScrapeId");
            if (!lastId) return;

            try {
                const user = auth.currentUser;
                if (!user) return;

                const docRef = doc(db, "users", user.uid, "scrapes", lastId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const item = docSnap.data() as ScrapeHistoryItem;
                    const resultData = item.result || item.data;

                    if (resultData) {
                        setData(resultData);
                        setCurrentHistoryId(lastId);

                        if (item.generatedEmail) {
                            setGeneratedEmail({
                                email: item.generatedEmail.email,
                                subject: item.generatedEmail.subject
                            });
                        }
                        console.log("🔄 Restored session from history:", lastId);
                    }
                }
            } catch (error) {
                console.error("Failed to restore session:", error);
            }
        };

        // Listen for auth state to ensure we have user before fetching
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                restoreState();
            }
        });

        return () => unsubscribe();
    }, []);

    const handleScrape = async (url: string) => {
        // 1. URL Validation
        let targetUrl = url.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        try {
            const parsedUrl = new URL(targetUrl);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                toast.error("Only HTTP and HTTPS URLs are supported");
                return;
            }
        } catch (e) {
            toast.error("Please enter a valid URL (e.g., example.com)");
            return;
        }

        setLoading(true);
        setData(null);
        setGeneratedEmail(null); // Clear email state on new scrape
        setCurrentHistoryId(null); // Clear history ID

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                toast.error("Please log in to use the scraper");
                setLoading(false);
                return;
            }

            const response = await axios.post("/api/scraper/light",
                { url: targetUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const scrapedData = response.data;
            setData(scrapedData);

            // Use the historyId returned from the API
            if (scrapedData.historyId) {
                setCurrentHistoryId(scrapedData.historyId);
                console.log("📝 distinct history ID from API:", scrapedData.historyId);
            }

            toast.success("Scrape completed successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to scrape website");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to detect industry from description/content
    const detectIndustry = (data: ScrapeResult): string => {
        const text = `${data.title} ${data.description} ${data.summary}`.toLowerCase();

        // Industry keywords mapping
        const industries: { [key: string]: string[] } = {
            "SaaS / Software": ["saas", "software", "platform", "app", "application", "cloud", "api"],
            "E-commerce": ["ecommerce", "e-commerce", "shop", "store", "retail", "marketplace", "cart"],
            "Marketing": ["marketing", "advertising", "seo", "content", "brand", "campaign", "digital marketing"],
            "Design / Creative": ["design", "creative", "agency", "branding", "graphics", "ui", "ux"],
            "Consulting": ["consulting", "consultant", "advisory", "strategy", "business consulting"],
            "Finance": ["finance", "fintech", "payment", "banking", "investment", "trading"],
            "Healthcare": ["health", "medical", "healthcare", "wellness", "clinic", "hospital"],
            "Education": ["education", "learning", "training", "course", "academy", "school"],
            "Real Estate": ["real estate", "property", "housing", "rental", "realtor"],
            "Manufacturing": ["manufacturing", "factory", "production", "industrial"],
            "Technology": ["tech", "technology", "ai", "machine learning", "data", "analytics"],
            "Media / Publishing": ["media", "publishing", "news", "content", "blog", "journalism"],
            "Travel / Hospitality": ["travel", "hotel", "tourism", "hospitality", "booking"],
            "Fitness / Sports": ["fitness", "gym", "sports", "training", "workout"],
            "Food / Beverage": ["food", "restaurant", "cafe", "beverage", "catering"],
            "Nonprofit": ["nonprofit", "charity", "foundation", "ngo", "social impact"]
        };

        // Check which industry has the most keyword matches
        let maxMatches = 0;
        let detectedIndustry = "General Business";

        for (const [industry, keywords] of Object.entries(industries)) {
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedIndustry = industry;
            }
        }

        return maxMatches > 0 ? detectedIndustry : "General Business";
    };

    const handleHistorySelect = (item: ScrapeHistoryItem) => {
        // Use the result field if available (new format), otherwise fallback to data (old format)
        const resultData = item.result || item.data;
        if (resultData) {
            setData(resultData);
            setCurrentHistoryId(item.id); // Track the ID of the selected history item

            // Load the generated email if it exists in the history item
            if (item.generatedEmail) {
                setGeneratedEmail({
                    email: item.generatedEmail.email,
                    subject: item.generatedEmail.subject
                });
            } else {
                setGeneratedEmail(null);
            }
        }
    };

    const handleGenerateEmail = async () => {
        if (!data) {
            toast.error("No scrape data available");
            return;
        }
        if (!data.emails || data.emails.length === 0) {
            toast.error("No email addresses found on this website");
            return;
        }

        setGeneratingEmail(true);
        try {
            const token = await auth.currentUser?.getIdToken();

            // Prepare context for AI
            const leadData = {
                email: data.emails[0],
                company: data.title || "",
                website: data.url,
                description: data.description || data.summary || "No description available",
                industry: detectIndustry(data), // Smart industry detection
                socialLinks: {
                    linkedin: data.socials?.linkedin || "",
                    twitter: data.socials?.twitter || "",
                    facebook: data.socials?.facebook || "",
                    instagram: data.socials?.instagram || ""
                },
                notes: data.summary || data.description || "Prospecting outreach",
                firstName: "",
                lastName: "",
                position: "",
                // Additional context for AI
                teamSize: data.team?.length || 0,
                hasTeamPage: (data.team?.length || 0) > 0,
                phones: data.phones?.join(", ") || ""
            };

            console.log("📧 Generating email with lead data:", leadData);

            const response = await axios.post("/api/generateEmail", {
                lead: leadData,
                type: "cold_outreach" // Default type
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { email, subject } = response.data;
            const newGeneratedEmail = { email, subject, generatedAt: new Date().toISOString() };

            setGeneratedEmail(newGeneratedEmail);

            // Save to Firestore if we have a history ID
            if (currentHistoryId) {
                try {
                    const user = auth.currentUser;
                    if (user) {
                        const historyRef = doc(db, "users", user.uid, "scrapes", currentHistoryId);
                        await updateDoc(historyRef, {
                            generatedEmail: newGeneratedEmail
                        });
                        console.log("💾 Saved email to Firestore");
                    }
                } catch (error) {
                    console.error("Failed to save email to Firestore:", error);
                }
            }

            toast.success("Email generated successfully!");
            setShowEmailModal(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to generate email");
        } finally {
            setGeneratingEmail(false);
        }
    };

    const handlePreviewEmail = () => {
        // Simply open the modal to preview the generated email
        setShowEmailModal(true);
    };

    // Wrapper for "Send Email" button in QuickActionsBar
    const handleSendFromQuickAction = () => {
        if (!generatedEmail) {
            toast.error("Please generate an email first");
            return;
        }
        // Call handleSendEmail with the current generated email content
        handleSendEmail(generatedEmail.subject, generatedEmail.email);
    };

    const handleSendEmail = async (subject: string, body: string) => {
        if (!body) {
            toast.error("Email body is required");
            return;
        }

        if (!data || !data.emails || data.emails.length === 0) {
            toast.error("No recipient email address found");
            return;
        }

        setSendingEmail(true);
        try {
            const token = await auth.currentUser?.getIdToken();

            console.log("📧 Sending email to:", data.emails[0]);
            const response = await axios.post("/api/sendEmail", {
                to: data.emails[0],
                subject: subject,
                body: body
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("📧 Email send response:", response.data);
            toast.success(`✅ Email sent successfully to ${data.emails[0]}!`, {
                duration: 5000,
            });

            // REMOVED: Clearing email from Firestore.
            // We want to KEEP the email so the user can see what they sent.

            // Don't clear generatedEmail state - keep it so "Preview Email" button stays
            // The user can still preview what they sent

            // Delay closing modal to ensure toast is visible
            setTimeout(() => {
                setShowEmailModal(false);
            }, 500);
        } catch (error: any) {
            console.error("❌ Email send error:", error);
            toast.error(error.response?.data?.error || "❌ Failed to send email. Please try again.", {
                duration: 5000,
            });
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* History Sidebar */}
            <AnimatePresence mode="wait">
                {showHistory && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="border-r border-border/50 bg-card/30 backdrop-blur-sm z-20"
                    >
                        <ScraperHistory
                            onSelect={handleHistorySelect}
                            selectedId={currentHistoryId}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {/* History Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 z-10 text-muted-foreground hover:text-primary"
                    onClick={() => setShowHistory(!showHistory)}
                >
                    {showHistory ? <ChevronLeft className="h-4 w-4" /> : <History className="h-4 w-4" />}
                </Button>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-5xl mx-auto space-y-8 pb-20">
                        <div className="text-center space-y-4 pt-8">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
                                Light Scraper
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Extract emails, social links, tech stack, and team members with AI-powered precision.
                            </p>
                        </div>

                        <ScraperInput onScrape={handleScrape} loading={loading} />

                        <AnimatePresence mode="wait">
                            {data && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <ScraperResults
                                        data={data}
                                        onGenerateEmail={handleGenerateEmail}
                                        onPreviewEmail={handlePreviewEmail}
                                        onSendEmail={handleSendFromQuickAction}
                                        generatingEmail={generatingEmail}
                                        emailGenerated={!!generatedEmail}
                                        sendingEmail={sendingEmail}
                                        industry={detectIndustry(data)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            {data && (
                <EmailModal
                    open={showEmailModal}
                    onOpenChange={setShowEmailModal}
                    emailAddress={data.emails[0] || ""}
                    generatedEmail={generatedEmail}
                    onSend={handleSendEmail}
                    sending={sendingEmail}
                />
            )}
        </div>
    );
}
