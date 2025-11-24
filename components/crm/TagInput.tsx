import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TagInputProps {
  onAddTag: (tag: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ onAddTag, placeholder = "Add tag...", className }: TagInputProps) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAddTag(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={handleAdd}
        disabled={!value.trim()}
        className="h-8 w-8 p-0"
        aria-label="Add tag"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
