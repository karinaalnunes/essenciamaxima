import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "done";
  priority: "high" | "medium" | "low";
  source_type: string;
  plan_period?: string;
  tags?: string[];
  due_date?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Partial<Task>) => void;
}

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "todo", title: "A Fazer", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "in_progress", title: "Em Progresso", color: "bg-yellow-50 dark:bg-yellow-950" },
  { id: "done", title: "Concluído", color: "bg-green-50 dark:bg-green-950" },
];

function SortableTaskCard({ task, onEdit, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function KanbanBoard({ tasks, onTaskMove, onTaskEdit, onTaskDelete, onTaskCreate }: KanbanBoardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [filters, setFilters] = useState({
    priority: "all",
    source: "all",
    period: "all",
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    if (columns.some(col => col.id === newStatus)) {
      onTaskMove(taskId, newStatus);
    }
  };

  const handleOpenModal = (task?: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      onTaskEdit(task);
    } else {
      onTaskCreate({ ...task, source_type: "manual" });
    }
    setEditingTask(undefined);
  };

  const filteredTasks = tasks.filter(task => {
    // Filtro de atrasadas
    if (showOverdueOnly) {
      const isOverdue = task.due_date && 
        new Date(task.due_date) < new Date() && 
        task.status !== "done";
      if (!isOverdue) return false;
    }
    
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.source !== "all" && task.source_type !== filters.source) return false;
    if (filters.period !== "all" && task.plan_period !== filters.period) return false;
    return true;
  });

  const getTasksByStatus = (status: string) => 
    filteredTasks.filter(task => task.status === status);

  const overdueCount = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== "done"
  ).length;

  const completedCount = tasks.filter(t => t.status === "done").length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="text-lg font-semibold">Kanban de Tarefas</h3>
          <Badge variant="secondary">
            {completedCount}/{totalCount} tarefas ({completionRate}%)
          </Badge>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              ⚠️ {overdueCount} {overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Button 
            variant={showOverdueOnly ? "destructive" : "outline"} 
            size="sm"
            onClick={() => setShowOverdueOnly(!showOverdueOnly)}
          >
            {showOverdueOnly ? "Ver Todas" : "Apenas Atrasadas"}
            {!showOverdueOnly && overdueCount > 0 && ` (${overdueCount})`}
          </Button>

          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="culture_report">Cultura</SelectItem>
              <SelectItem value="mvv_report">MVV</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.period} onValueChange={(value) => setFilters({ ...filters, period: value })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="120">120 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div key={column.id} className={`rounded-lg p-4 min-h-[500px] ${column.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{column.title}</h4>
                  <Badge variant="outline">{columnTasks.length}</Badge>
                </div>

                <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleOpenModal}
                        onDelete={onTaskDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(undefined);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
}
