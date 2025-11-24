/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Upload, File, CloudUpload, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return toast.error("Select file");
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file);
      const token = await auth.currentUser!.getIdToken();
      await axios.post("/api/uploadCSV", fd, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      toast.success("Leads uploaded successfully");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-full">
        <PageHeader 
          title="Upload Leads" 
          description="Import your leads from a CSV file to start generating outreach."
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Left Column: Upload Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border border-border bg-card p-8">
                <label className="block text-sm font-medium text-foreground mb-4">CSV File</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                      file 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    {file ? (
                      <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <File className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                          <CloudUpload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">CSV format (first row as header)</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={upload}
                    disabled={loading || !file}
                    className="w-full sm:w-auto min-w-[150px]"
                    size="lg"
                  >
                    {loading ? "Uploading..." : "Upload Leads"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Instructions */}
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <File className="w-4 h-4 text-primary" />
                  Format Requirements
                </h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Your CSV file must include a header row with specific column names for the import to work correctly.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wider">Required Columns</p>
                    <div className="flex flex-wrap gap-2">
                      <code className="bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border">name</code>
                      <code className="bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border">email</code>
                      <code className="bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border">company</code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wider">Optional Columns</p>
                    <div className="flex flex-wrap gap-2">
                      <code className="bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border">role</code>
                      <code className="bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border">website</code>
                      <code className="bg-secondary px-2 py-1 rounded text-xs text-foreground border border-border">industry</code>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  Maximum file size is 10MB. Large files may take a few moments to process.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
