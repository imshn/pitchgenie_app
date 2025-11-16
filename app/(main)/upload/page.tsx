/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Upload, File as FileIcon, CheckCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UploadCSVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const router = useRouter();

  // redirect if not logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setUploaded(false);
  };

  const handleUpload = () => {
    if (!file) return alert("Please select a CSV file to upload.");

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: any) => {
        const rows = result.data;
        const uid = auth.currentUser?.uid;

        if (!uid) {
          alert("Login required.");
          setLoading(false);
          return;
        }

        try {
          for (const row of rows) {
            if (!row.email) {
              console.warn("Skipping row without email:", row);
              continue;
            }

            await addDoc(collection(db, "leads"), {
              uid,
              name: row.name?.trim() || "",
              company: row.company?.trim() || "",
              role: row.role?.trim() || "",
              email: row.email?.trim() || "",         // ⭐ FIXED
              website: row.website?.trim() || "",
              subject: "",
              body: "",
              followUp: "",
              persona: null,
              industry: null,
              createdAt: new Date().toISOString(),
            });
          }

          setUploaded(true);
          setTimeout(() => router.push("/leads"), 1500);
        } catch (error) {
          console.error("Upload error:", error);
          alert("Error uploading CSV. Try again.");
        } finally {
          setLoading(false);
        }
      },
      error: (error: any) => {
        console.error("CSV parse error:", error);
        alert("Invalid CSV format.");
        setLoading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const csvContent =
      "name,company,role,email,website\nJohn Doe,Acme Inc.,CEO,john@acme.com,https://acme.com";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leads_template.csv";
    link.click();
  };

  return (
    <div className="space-y-6 mx-30">
      <h1 className="text-3xl font-bold">Upload Leads</h1>

      <Card className="w-full max-w-full bg-white/5 border border-white/10 rounded-3xl">
        <CardHeader>
          <CardTitle>Upload a CSV File</CardTitle>
          <CardDescription>
            Required columns:<br />
            <b>name, company, role, email, website</b>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-input"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FileIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {file.name}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag & drop
                    </p>
                    <p className="text-xs text-gray-500">CSV Only</p>
                  </>
                )}
              </div>
              <Input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <Button onClick={downloadTemplate} variant="outline">
            Download CSV Template
          </Button>
        </CardContent>

        <CardFooter className="flex justify-end">
          {uploaded ? (
            <div className="flex items-center text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" /> Uploaded! Redirecting…
            </div>
          ) : (
            <Button onClick={handleUpload} disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload File"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
