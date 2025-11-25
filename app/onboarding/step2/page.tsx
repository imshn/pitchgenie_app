/**
 * Onboarding Step 2: Profile Setup
 * Enhanced with animations
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AnimatedBackground } from "@/components/onboarding/AnimatedBackground";
import { MotionCard } from "@/components/onboarding/MotionCard";
import { TagInput } from "@/components/onboarding/TagInput";
import { Loader2, User, Building } from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardingStep2() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [skipping, setSkipping] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [gender, setGender] = useState("");
    const [role, setRole] = useState("");
    const [persona, setPersona] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyDescription, setCompanyDescription] = useState("");
    const [companyLocation, setCompanyLocation] = useState("");
    const [servicesOffered, setServicesOffered] = useState<string[]>([]);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            const token = await user.getIdToken();
            const res = await axios.get("/api/onboarding/get", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setName(res.data.name || "");
            setGender(res.data.gender || "");
            setRole(res.data.role || "");
            setPersona(res.data.persona || "");
            setCompanyName(res.data.companyName || "");
            setCompanyWebsite(res.data.companyWebsite || "");
            setCompanyDescription(res.data.companyDescription || "");
            setCompanyLocation(res.data.companyLocation || "");
            setServicesOffered(res.data.servicesOffered || []);

            if (res.data.onboardingCompleted) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndContinue = async () => {
        setSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            await axios.post(
                "/api/onboarding/update",
                {
                    onboardingStep: 3,
                    name,
                    gender,
                    role,
                    persona,
                    companyName,
                    companyWebsite,
                    companyDescription,
                    companyLocation,
                    servicesOffered,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Profile saved!");
            router.push("/onboarding/step3");
        } catch (error) {
            toast.error("Failed to save profile");
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        setSkipping(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            await axios.post(
                "/api/onboarding/skip-profile",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            router.push("/onboarding/step3");
        } catch (error) {
            toast.error("Failed to skip");
            setSkipping(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <AnimatedBackground />

            <div className="w-full max-w-3xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ProgressIndicator currentStep={2} />
                </motion.div>

                <MotionCard delay={0.1} direction="left" className="border-2">
                    <CardHeader>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
                            <CardDescription>
                                Tell us about yourself and your company (all fields optional)
                            </CardDescription>
                        </motion.div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <motion.div
                            className="space-y-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <User className="h-4 w-4" />
                                <span>Basic Information</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="transition-transform focus:scale-[1.02]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="founder">Founder</SelectItem>
                                            <SelectItem value="sdr">SDR</SelectItem>
                                            <SelectItem value="consultant">Consultant</SelectItem>
                                            <SelectItem value="marketer">Marketer</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="persona">Writing Persona</Label>
                                    <Select value={persona} onValueChange={setPersona}>
                                        <SelectTrigger id="persona">
                                            <SelectValue placeholder="Select persona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="founder-tone">Founder Tone</SelectItem>
                                            <SelectItem value="sales-tone">Sales Tone</SelectItem>
                                            <SelectItem value="consultant-tone">Consultant Tone</SelectItem>
                                            <SelectItem value="friendly-tone">Friendly Tone</SelectItem>
                                            <SelectItem value="professional-tone">Professional Tone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </motion.div>

                        {/* Company Info */}
                        <motion.div
                            className="space-y-4 pt-4 border-t"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Building className="h-4 w-4" />
                                <span>Company Information</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Your company"
                                        className="transition-transform focus:scale-[1.02]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyWebsite">Website</Label>
                                    <Input
                                        id="companyWebsite"
                                        type="url"
                                        value={companyWebsite}
                                        onChange={(e) => setCompanyWebsite(e.target.value)}
                                        placeholder="https://example.com"
                                        className="transition-transform focus:scale-[1.02]"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="companyDescription">Company Description</Label>
                                    <Textarea
                                        id="companyDescription"
                                        value={companyDescription}
                                        onChange={(e) => setCompanyDescription(e.target.value)}
                                        placeholder="What does your company do?"
                                        rows={3}
                                        className="transition-transform focus:scale-[1.01]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyLocation">Location</Label>
                                    <Input
                                        id="companyLocation"
                                        value={companyLocation}
                                        onChange={(e) => setCompanyLocation(e.target.value)}
                                        placeholder="City, Country"
                                        className="transition-transform focus:scale-[1.02]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="servicesOffered">Services Offered</Label>
                                    <TagInput
                                        value={servicesOffered}
                                        onChange={setServicesOffered}
                                        placeholder="Add a service..."
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            className="flex gap-3 pt-4 border-t"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="flex-1"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={handleSaveAndContinue}
                                    disabled={saving || skipping}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save & Continue"
                                    )}
                                </Button>
                            </motion.div>

                            <motion.div
                                className="flex-1"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleSkip}
                                    disabled={saving || skipping}
                                >
                                    {skipping ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Skipping...
                                        </>
                                    ) : (
                                        "Skip This Step"
                                    )}
                                </Button>
                            </motion.div>
                        </motion.div>
                    </CardContent>
                </MotionCard>
            </div>
        </div>
    );
}
