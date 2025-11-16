/* eslint-disable @typescript-eslint/no-explicit-any */
// app/templates/page.tsx
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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
      <div className="glass card">
        <h2 className="text-xl font-semibold">Templates</h2>
        <p className="text-gray-300 mt-2">Saved email templates</p>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {templates.length === 0 && <div className="text-gray-400">No templates yet</div>}
          {templates.map((t) => (
            <div key={t.id} className="p-4 bg-white/5 rounded-md">
              <div className="font-semibold">{t.title || "Untitled Template"}</div>
              <div className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{t.body}</div>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}