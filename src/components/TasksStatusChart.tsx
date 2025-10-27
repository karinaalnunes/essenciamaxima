import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";

interface TasksStatusChartProps {
  tasks: Array<{ 
    status: string;
    due_date?: string;
  }>;
}

export function TasksStatusChart({ tasks }: TasksStatusChartProps) {
  // Calcular tarefas atrasadas
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== "done"
  );

  const statusCount = {
    overdue: overdueTasks.length,
    backlog: tasks.filter(t => t.status === "backlog" && !overdueTasks.includes(t)).length,
    todo: tasks.filter(t => t.status === "todo" && !overdueTasks.includes(t)).length,
    in_progress: tasks.filter(t => t.status === "in_progress" && !overdueTasks.includes(t)).length,
    done: tasks.filter(t => t.status === "done").length,
  };

  // Filtrar apenas categorias com valor > 0
  const data = [
    { name: "Em Atraso", value: statusCount.overdue, color: "#ef4444" },
    { name: "Backlog", value: statusCount.backlog, color: "#64748b" },
    { name: "A Fazer", value: statusCount.todo, color: "#3b82f6" },
    { name: "Em Progresso", value: statusCount.in_progress, color: "#f59e0b" },
    { name: "Concluído", value: statusCount.done, color: "#10b981" },
  ].filter(item => item.value > 0);

  const total = tasks.length;
  const overduePercentage = total > 0 ? Math.round((statusCount.overdue / total) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Distribuição de Tarefas</h3>
        {statusCount.overdue > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {statusCount.overdue} atrasadas
          </Badge>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value, "Tarefas"]}
            contentStyle={{ 
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px"
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => `${value} (${entry.value})`}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
        <div>
          <p className="text-muted-foreground">Total de tarefas</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        {statusCount.overdue > 0 && (
          <div>
            <p className="text-muted-foreground">Taxa de atraso</p>
            <p className="text-2xl font-bold text-destructive">{overduePercentage}%</p>
          </div>
        )}
      </div>
    </Card>
  );
}