/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FileText } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const q = query(collection(db, "templates"), where("uid", "==", u.uid));
      const snap = await getDocs(q);
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    const unsub = auth.onAuthStateChanged(async (u) => { if (u) await load(); else setTemplates([]); });
    return () => unsub();
  }, []);

  return (
    <AuthGuard>
      <main className="pl-64 min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Templates</h1>
            <p className="text-muted-foreground">Manage your saved email templates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 && (
              <div className="col-span-full glass border border-dashed border-border rounded-lg p-8 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No templates yet. Create one from your generated emails.</p>
              </div>
            )}
            {templates.map((t) => (
              <div key={t.id} className="glass border border-border rounded-lg p-6 shadow-premium hover:bg-secondary/40 transition-colors duration-150">
                <h3 className="font-semibold text-foreground mb-2">{t.title || "Untitled Template"}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
