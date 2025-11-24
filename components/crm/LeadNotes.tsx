import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface LeadNotesProps {
  leadId: string;
  initialNotes: string;
  updatedAt?: number | null;
  className?: string;
}

export function LeadNotes({ leadId, initialNotes, updatedAt, className }: LeadNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastUpdated, setLastUpdated] = useState<number | null | undefined>(updatedAt);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state if prop changes (e.g. switching leads)
  useEffect(() => {
    setNotes(initialNotes);
    setLastUpdated(updatedAt);
    setStatus("idle");
  }, [leadId, initialNotes, updatedAt]);

  const saveNotes = async (content: string) => {
    setStatus("saving");
    try {
      const now = Date.now();
      await updateDoc(doc(db, "leads", leadId), {
        notes: content,
        notesUpdatedAt: now,
      });
      setLastUpdated(now);
      setStatus("saved");
      
      // Reset saved status after 2 seconds
      setTimeout(() => {
        if (status === "saved") setStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setStatus("error");
      toast.error("Failed to save notes");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setNotes(newValue);
    setStatus("idle");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveNotes(newValue);
    }, 700); // 700ms debounce
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wider">Notes</span>
        <div className="flex items-center gap-2">
          {status === "saving" && (
            <span className="flex items-center gap-1 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {status === "saved" && (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              Error
            </span>
          )}
          {lastUpdated && status !== "saving" && (
            <span>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <Textarea
        value={notes}
        onChange={handleChange}
        placeholder="Add notes about this lead..."
        className="min-h-[150px] resize-none bg-background/50 focus:bg-background transition-colors"
      />
    </div>
  );
}
