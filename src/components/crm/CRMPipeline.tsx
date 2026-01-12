import { useState } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDraggable,
  useDroppable,
  DragOverEvent
} from "@dnd-kit/core";
import { CompanyCRM, PIPELINE_STAGES, PipelineStage } from "./types";
import { CRMCompanyCard } from "./CRMCompanyCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CRMPipelineProps {
  companies: CompanyCRM[];
  onStageChange: (companyId: string, newStage: PipelineStage) => void;
  onCompanyClick: (company: CompanyCRM) => void;
}

interface DraggableCardProps {
  company: CompanyCRM;
  onCompanyClick: (company: CompanyCRM) => void;
}

function DraggableCard({ company, onCompanyClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: company.id,
    data: { stage: company.pipeline_stage }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`mb-2 w-full max-w-full ${isDragging ? 'opacity-0' : ''}`}
    >
      <CRMCompanyCard 
        company={company} 
        onClick={() => onCompanyClick(company)}
        isDragging={isDragging}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
}

interface DroppableColumnProps {
  stage: { id: PipelineStage; label: string; color: string };
  companies: CompanyCRM[];
  onCompanyClick: (company: CompanyCRM) => void;
  isOver: boolean;
}

function DroppableColumn({ stage, companies, onCompanyClick, isOver }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: { type: 'column', stage: stage.id }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] bg-muted/30 rounded-lg border transition-all duration-200 ${
        isOver 
          ? 'border-primary ring-2 ring-primary/30 bg-primary/5' 
          : 'border-border/50'
      }`}
    >
      {/* Column Header */}
      <div className={`p-3 border-b border-border/50 ${stage.color} bg-opacity-10 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{stage.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {companies.length}
          </Badge>
        </div>
      </div>
      
      {/* Column Content */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="p-2 min-h-[100px]">
          {companies.length === 0 ? (
            <div 
              className={`h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground transition-colors ${
                isOver ? 'border-primary bg-primary/5' : 'border-border/50'
              }`}
            >
              Arraste empresas aqui
            </div>
          ) : (
            companies.map(company => (
              <DraggableCard 
                key={company.id} 
                company={company}
                onCompanyClick={onCompanyClick}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function CRMPipeline({ companies, onStageChange, onCompanyClick }: CRMPipelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  
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

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const overId = over.id as string;
    const activeCompanyId = active.id as string;
    const company = companies.find(c => c.id === activeCompanyId);

    if (!company) return;

    // Check if dropped on a stage column
    const targetStage = PIPELINE_STAGES.find(s => s.id === overId);
    if (targetStage) {
      if (company.pipeline_stage !== targetStage.id) {
        onStageChange(activeCompanyId, targetStage.id);
      }
      return;
    }

    // Check if dropped on another card - use that card's stage
    const targetCompany = companies.find(c => c.id === overId);
    if (targetCompany && company.pipeline_stage !== targetCompany.pipeline_stage) {
      onStageChange(activeCompanyId, targetCompany.pipeline_stage);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const getCompaniesForStage = (stage: PipelineStage) => {
    return companies.filter(c => c.pipeline_stage === stage);
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageCompanies = getCompaniesForStage(stage.id);
          const isOver = overId === stage.id;
          
          return (
            <DroppableColumn
              key={stage.id}
              stage={stage}
              companies={stageCompanies}
              onCompanyClick={onCompanyClick}
              isOver={isOver}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCompany && (
          <div className="rotate-2 scale-105 opacity-90 w-[260px]">
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
