import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CompanyCRM, PIPELINE_STAGES, PipelineStage } from "./types";
import { CRMCompanyCard } from "./CRMCompanyCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CRMPipelineProps {
  companies: CompanyCRM[];
  onStageChange: (companyId: string, newStage: PipelineStage) => void;
  onCompanyClick: (company: CompanyCRM) => void;
}

function SortableCard({ company, onCompanyClick }: { company: CompanyCRM; onCompanyClick: (company: CompanyCRM) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: company.id,
    data: { stage: company.pipeline_stage }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="mb-2"
    >
      <CRMCompanyCard 
        company={company} 
        onClick={() => onCompanyClick(company)}
        isDragging={isDragging}
      />
    </div>
  );
}

export function CRMPipeline({ companies, onStageChange, onCompanyClick }: CRMPipelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeCompany = activeId ? companies.find(c => c.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    const activeCompanyId = active.id as string;

    // Check if dropped on a stage column
    const targetStage = PIPELINE_STAGES.find(s => s.id === overId);
    if (targetStage) {
      const company = companies.find(c => c.id === activeCompanyId);
      if (company && company.pipeline_stage !== targetStage.id) {
        onStageChange(activeCompanyId, targetStage.id);
      }
      return;
    }

    // Check if dropped on another card - use that card's stage
    const targetCompany = companies.find(c => c.id === overId);
    if (targetCompany) {
      const company = companies.find(c => c.id === activeCompanyId);
      if (company && company.pipeline_stage !== targetCompany.pipeline_stage) {
        onStageChange(activeCompanyId, targetCompany.pipeline_stage);
      }
    }
  };

  const getCompaniesForStage = (stage: PipelineStage) => {
    return companies.filter(c => c.pipeline_stage === stage);
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageCompanies = getCompaniesForStage(stage.id);
          
          return (
            <div 
              key={stage.id}
              className="flex-shrink-0 w-[280px] bg-muted/30 rounded-lg border border-border/50"
            >
              {/* Column Header */}
              <div className={`p-3 border-b border-border/50 ${stage.color} bg-opacity-10 rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stageCompanies.length}
                  </Badge>
                </div>
              </div>
              
              {/* Column Content */}
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="p-2">
                  <SortableContext 
                    items={stageCompanies.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                    id={stage.id}
                  >
                    {stageCompanies.length === 0 ? (
                      <div 
                        className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground"
                        data-stage={stage.id}
                      >
                        Arraste empresas aqui
                      </div>
                    ) : (
                      stageCompanies.map(company => (
                        <SortableCard 
                          key={company.id} 
                          company={company}
                          onCompanyClick={onCompanyClick}
                        />
                      ))
                    )}
                  </SortableContext>
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeCompany && (
          <div className="rotate-3 scale-105">
            <CRMCompanyCard 
              company={activeCompany} 
              onClick={() => {}}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
