import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineCard } from "./PipelineCard";
import { useState } from "react";
import { createPortal } from "react-dom";

interface PipelineBoardProps {
  leads: any[];
  onDragEnd: (leadId: string, newStatus: string) => void;
  onViewLead: (lead: any) => void;
}

const COLUMNS = [
  { id: "new", title: "New" },
  { id: "contacted", title: "Contacted" },
  { id: "replied", title: "Replied" },
  { id: "hot", title: "Hot" },
  { id: "not_interested", title: "Not Interested" },
];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function PipelineBoard({ leads, onDragEnd, onViewLead }: PipelineBoardProps) {
  const [activeLead, setActiveLead] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveLead(null);
      return;
    }

    const leadId = active.id as string;
    const newStatus = over.id as string;
    
    // Only trigger update if status actually changed
    const currentLead = leads.find(l => l.id === leadId);
    if (currentLead && currentLead.status !== newStatus) {
      onDragEnd(leadId, newStatus);
    }

    setActiveLead(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start">
        {COLUMNS.map((col) => (
          <PipelineColumn
            key={col.id}
            id={col.id}
            title={col.title}
            leads={leads.filter((l) => (l.status || "new") === col.id)}
            onViewLead={onViewLead}
          />
        ))}
      </div>

      {/* Drag Overlay */}
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeLead ? (
            <div className="w-[280px] rotate-2 cursor-grabbing">
               <PipelineCard lead={activeLead} onView={() => {}} />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
