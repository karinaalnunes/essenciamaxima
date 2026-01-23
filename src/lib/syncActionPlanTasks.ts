import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";

interface ActionPlan {
  what: string;
  why?: string;
  who?: string;
  when?: string;
  where?: string;
  how?: string;
  how_much?: string;
}

interface SyncResult {
  tasksCreated: number;
  errors: string[];
}

/**
 * Sincroniza as tarefas do plano de ação do relatório de cultura para o Kanban (user_tasks)
 * Evita duplicatas verificando se já existem tarefas com o mesmo culture_document_id e plan_period
 */
export async function syncActionPlanToKanban(
  userId: string,
  cultureDocumentId: string,
  actionPlan30: ActionPlan[] = [],
  actionPlan60: ActionPlan[] = [],
  actionPlan90: ActionPlan[] = [],
  actionPlan120: ActionPlan[] = []
): Promise<SyncResult> {
  const result: SyncResult = { tasksCreated: 0, errors: [] };

  // Verificar se já existem tarefas para este documento (evitar duplicatas)
  const { data: existingTasks, error: checkError } = await supabase
    .from("user_tasks")
    .select("id, plan_period")
    .eq("user_id", userId)
    .eq("culture_document_id", cultureDocumentId)
    .eq("source_type", "culture_report");

  if (checkError) {
    console.error("Erro ao verificar tarefas existentes:", checkError);
    result.errors.push("Erro ao verificar tarefas existentes");
    return result;
  }

  // Agrupar tarefas existentes por período
  const existingPeriods = new Set(existingTasks?.map(t => t.plan_period) || []);

  const today = new Date();
  const tasksToInsert: any[] = [];

  const processActionPlan = (
    actions: ActionPlan[],
    period: string,
    priority: "high" | "medium" | "low"
  ) => {
    // Se já existem tarefas para este período, pular
    if (existingPeriods.has(period)) {
      console.log(`Tarefas do período ${period} dias já existem, pulando...`);
      return;
    }

    const dueDate = addDays(today, parseInt(period));

    for (const action of actions) {
      if (!action.what || action.what.trim() === "") continue;

      const descriptionParts = [];
      if (action.how) descriptionParts.push(`**Como:** ${action.how}`);
      if (action.why) descriptionParts.push(`**Por que:** ${action.why}`);
      if (action.where) descriptionParts.push(`**Onde:** ${action.where}`);
      if (action.who) descriptionParts.push(`**Quem:** ${action.who}`);
      if (action.how_much) descriptionParts.push(`**Quanto:** ${action.how_much}`);

      tasksToInsert.push({
        user_id: userId,
        culture_document_id: cultureDocumentId,
        title: action.what,
        description: descriptionParts.join("\n"),
        status: "todo",
        priority,
        source_type: "culture_report",
        plan_period: period,
        due_date: dueDate.toISOString().split("T")[0],
        tags: ["plano-de-ação", `${period}-dias`],
      });
    }
  };

  // Processar cada período com prioridades diferentes
  processActionPlan(actionPlan30, "30", "high");
  processActionPlan(actionPlan60, "60", "medium");
  processActionPlan(actionPlan90, "90", "medium");
  processActionPlan(actionPlan120, "120", "low");

  if (tasksToInsert.length === 0) {
    console.log("Nenhuma nova tarefa para inserir");
    return result;
  }

  // Inserir todas as tarefas de uma vez
  const { error: insertError } = await supabase
    .from("user_tasks")
    .insert(tasksToInsert);

  if (insertError) {
    console.error("Erro ao inserir tarefas:", insertError);
    result.errors.push("Erro ao criar tarefas no Kanban");
    return result;
  }

  result.tasksCreated = tasksToInsert.length;
  return result;
}
