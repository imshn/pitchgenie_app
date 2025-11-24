import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagChipProps {
  tag: string;
  onRemove?: (tag: string) => void;
  className?: string;
}

export function TagChip({ tag, onRemove, className }: TagChipProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn("gap-1 pr-1 hover:bg-secondary/80 transition-colors", className)}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="rounded-full p-0.5 hover:bg-background/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          aria-label={`Remove tag ${tag}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
