import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, Building2 } from "lucide-react";
import { TagChip } from "./TagChip";
import { cn } from "@/lib/utils";

interface PipelineCardProps {
  lead: any;
  onView: (lead: any) => void;
}

export function PipelineCard({ lead, onView }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { ...lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card 
        className={cn(
          "mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-card/50 backdrop-blur-sm border-border/50",
          isDragging && "opacity-50 shadow-xl ring-2 ring-primary rotate-2"
        )}
      >
        <CardHeader className="p-3 pb-2 space-y-0">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
              {lead.name}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onView(lead);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          {lead.company && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-2 space-y-3">
          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag: string) => (
                <TagChip key={tag} tag={tag} className="text-[10px] h-5 px-1.5" />
              ))}
              {lead.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                  +{lead.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              {lead.notes && (
                <div className="group relative">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                  <div className="absolute bottom-full left-0 mb-2 hidden w-48 rounded bg-popover p-2 text-xs shadow-md group-hover:block z-50 border border-border">
                    <p className="line-clamp-3">{lead.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {lead.role || "No Role"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
