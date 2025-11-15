/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Upload, File as FileIcon, CheckCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UploadCSVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
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
          alert("You must be logged in to upload leads.");
          setLoading(false);
          return;
        }

        try {
          for (const row of rows) {
            await addDoc(collection(db, "leads"), {
              uid,
              name: row.name || "",
              company: row.company || "",
              role: row.role || "",
              website: row.website || "",
              subject: "",
              body: "",
              followUp: "",
              createdAt: new Date().toISOString(),
            });
          }
          setUploaded(true);
          setTimeout(() => router.push("/dashboard"), 2000);
        } catch (error) {
          console.error("Error uploading leads:", error);
          alert("An error occurred while uploading your leads. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      error: (error: any) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to parse CSV file. Please check the file format and try again.");
        setLoading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const csvContent = "name,company,role,website\nJohn Doe,Acme Inc.,CEO,https://acme.com";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "leads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 mx-30">
      <h1 className="text-3xl font-bold">Upload Leads</h1>
      <Card className="w-full max-w-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] rounded-3xl">
        <CardHeader>
          <CardTitle>Upload a CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: name, company, role, and website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FileIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">{file.name}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CSV (MAX. 800x400px)</p>
                  </>
                )}
              </div>
              <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          </div>
          <Button onClick={downloadTemplate} className="rounded-full bg-white/10 hover:bg-white/20 border border-white/10" variant="link">
            Download CSV Template
          </Button>
        </CardContent>
        <CardFooter className="flex justify-end">
          {uploaded ? (
            <div className="flex items-center text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Uploaded Successfully! Redirecting...</span>
            </div>
          ) : (
            <Button className="rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10" onClick={handleUpload} disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload File"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
