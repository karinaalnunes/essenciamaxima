import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TasksTimelineChartProps {
  tasks: Array<{ 
    status: string; 
    completed_at?: string;
    created_at: string;
  }>;
  days?: number;
}

export function TasksTimelineChart({ tasks, days = 30 }: TasksTimelineChartProps) {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const data = dateRange.map(date => {
    const dayCompleted = tasks.filter(task => 
      task.completed_at && 
      format(new Date(task.completed_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    ).length;

    const dayCreated = tasks.filter(task =>
      format(new Date(task.created_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    ).length;

    return {
      date: format(date, "dd/MMM", { locale: ptBR }),
      fullDate: format(date, "dd/MM/yyyy"),
      concluidas: dayCompleted,
      criadas: dayCreated,
    };
  });

  let accumulated = 0;
  const dataWithAccumulated = data.map(d => {
    accumulated += d.concluidas;
    return { ...d, acumulado: accumulated };
  });

  const totalCompleted = dataWithAccumulated[dataWithAccumulated.length - 1]?.acumulado || 0;
  const totalCreated = data.reduce((acc, d) => acc + d.criadas, 0);
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Evolução das Tarefas (Últimos {days} dias)</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={dataWithAccumulated} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: 12 }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-semibold text-sm mb-2">{payload[0].payload.fullDate}</p>
                    <p className="text-sm" style={{ color: "hsl(var(--chart-2))" }}>
                      ✅ Concluídas: {payload[0].payload.concluidas}
                    </p>
                    <p className="text-sm" style={{ color: "hsl(var(--chart-1))" }}>
                      📝 Criadas: {payload[0].payload.criadas}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 pt-1 border-t border-border">
                      📊 Acumulado: {payload[0].payload.acumulado}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="concluidas" 
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorConcluidas)" 
            name="Concluídas"
          />
          <Area 
            type="monotone" 
            dataKey="criadas" 
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCriadas)" 
            name="Criadas"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>
            {totalCompleted}
          </p>
          <p className="text-xs text-muted-foreground">Total Concluídas</p>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: "hsl(var(--chart-1))" }}>
            {totalCreated}
          </p>
          <p className="text-xs text-muted-foreground">Total Criadas</p>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: "hsl(var(--chart-5))" }}>
            {completionRate}%
          </p>
          <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
        </div>
      </div>
    </Card>
  );
}