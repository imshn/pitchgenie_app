/* eslint-disable @typescript-eslint/no-explicit-any */
// app/upload/page.tsx
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

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
      await axios.post("/api/upload", fd, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      toast.success("Uploaded");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="glass card">
        <h2 className="text-xl font-semibold">Upload CSV</h2>
        <p className="text-gray-300 mt-2">Upload leads CSV (first row as header)</p>

        <div className="mt-4">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="mt-4">
            <button onClick={upload} className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500" disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}