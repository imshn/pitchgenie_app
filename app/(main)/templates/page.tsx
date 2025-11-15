/* eslint-disable @typescript-eslint/no-explicit-any */
// app/templates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async (uid: string) => {
    try {
      const q = query(collection(db, "templates"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      setTemplates(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Template read error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      loadTemplates(user.uid);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-10 text-gray-400">Loading templates...</div>;

  return (
    <div className="space-y-8 p-6 mx-25">
      <h1 className="text-3xl font-bold">Templates</h1>

      {templates.length === 0 && <p className="text-gray-400">No templates saved yet.</p>}

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="p-5 rounded-xl bg-white/5 border border-white/10">
            <h2 className="font-semibold text-lg">{tpl.title || "Untitled Template"}</h2>
            <pre className="text-gray-300 whitespace-pre-wrap mt-2">{tpl.prompt}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
