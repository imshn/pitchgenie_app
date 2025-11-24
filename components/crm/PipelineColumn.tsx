import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PipelineCard } from "./PipelineCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PipelineColumnProps {
  id: string;
  title: string;
  leads: any[];
  onViewLead: (lead: any) => void;
}

export function PipelineColumn({ id, title, leads, onViewLead }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[280px] w-[280px] rounded-lg bg-secondary/20 border border-border/50">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-border/50 bg-secondary/30 rounded-t-lg backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <Badge variant="secondary" className="text-xs font-normal bg-background/50">
          {leads.length}
        </Badge>
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef} 
        className={cn(
          "flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <PipelineCard key={lead.id} lead={lead} onView={onViewLead} />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border/30 rounded-lg m-1">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}
