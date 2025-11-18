/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { Upload, File } from 'lucide-react';

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
      <main className="pl-64 min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Upload Leads</h1>
            <p className="text-muted-foreground">Import leads from a CSV file</p>
          </div>

          <div className="glass border border-border rounded-lg p-8 shadow-premium">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-4">CSV File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors duration-150"
                  >
                    {file ? (
                      <div className="text-center">
                        <File className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">CSV format (first row as header)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                onClick={upload}
                disabled={loading || !file}
                className="w-full px-4 py-3 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          <div className="mt-8 glass border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">Format Requirements</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• First row must contain column headers</li>
              <li>• Required columns: name, email, company</li>
              <li>• Optional columns: role, website, industry</li>
              <li>• Maximum file size: 10 MB</li>
            </ul>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
