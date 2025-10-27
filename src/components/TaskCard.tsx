import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: "high" | "medium" | "low";
    tags?: string[];
    due_date?: string;
    plan_period?: string;
    source_type: string;
  };
  onEdit: (task: any) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  high: "destructive",
  medium: "default",
  low: "secondary",
} as const;

const sourceTypeLabels = {
  culture_report: "Cultura",
  mvv_report: "MVV",
  meeting: "Reunião",
  manual: "Manual",
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm flex-1 line-clamp-2">{task.title}</h4>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant={priorityColors[task.priority]} className="text-xs">
            {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {sourceTypeLabels[task.source_type as keyof typeof sourceTypeLabels]}
          </Badge>

          {task.plan_period && (
            <Badge variant="outline" className="text-xs">
              {task.plan_period} dias
            </Badge>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {task.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs text-muted-foreground">
                {tag}{i < Math.min(task.tags!.length - 1, 2) && ","}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{task.tags.length - 3}</span>
            )}
          </div>
        )}

        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        )}
      </div>
    </Card>
  );
}
