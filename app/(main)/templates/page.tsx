/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FileText, Plus, MoreVertical, Pencil, Trash } from 'lucide-react';
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <div className="flex flex-col h-full">
        <PageHeader 
          title="Templates" 
          description="Manage your saved email templates for faster outreach."
        >
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </PageHeader>

        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-card/50">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No templates yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Create templates from your generated emails to reuse them later.
                </p>
                <Button variant="outline" className="mt-4">
                  Create your first template
                </Button>
              </div>
            )}
            {templates.map((t) => (
              <div 
                key={t.id} 
                className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{t.title || "Untitled Template"}</h3>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap leading-relaxed flex-1 mb-4">
                  {t.body}
                </p>
                
                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last updated 2d ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
