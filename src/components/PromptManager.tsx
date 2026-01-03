import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Edit, Clock, CheckCircle, Archive, MessageSquare, ClipboardList } from "lucide-react";
import { PromptEditor } from "./PromptEditor";
import { AnamnesisQuestionsEditor } from "./AnamnesisQuestionsEditor";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
interface AssistantPrompt {
  id: string;
  assistant_key: string;
  name: string;
  description: string | null;
  system_prompt: string;
  version: string;
  version_notes: string | null;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  active: { label: "Ativo", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  draft: { label: "Rascunho", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  archived: { label: "Arquivado", color: "bg-muted text-muted-foreground border-border", icon: Archive },
};

// Mapping of modules to their chat and report prompt keys
const promptPairs = [
  { 
    module: 'Anamnese', 
    emoji: '📋',
    chatKey: null, 
    reportKey: 'generate-anamnesis-report' 
  },
  { 
    module: 'MVV', 
    emoji: '🎯',
    chatKey: 'consultative-chat', 
    reportKey: 'generate-mvv' 
  },
  { 
    module: 'Cultura', 
    emoji: '🧬',
    chatKey: 'culture-chat', 
    reportKey: 'generate-culture-report' 
  },
  { 
    module: 'Cadeia de Valor', 
    emoji: '⛓️',
    chatKey: 'value-chain-chat', 
    reportKey: 'generate-value-chain-report' 
  },
  { 
    module: 'Processos', 
    emoji: '⚙️',
    chatKey: 'process-chat', 
    reportKey: 'generate-process-report' 
  },
];

export function PromptManager() {
  const [prompts, setPrompts] = useState<AssistantPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<AssistantPrompt | null>(null);
  const [editingAnamnesisQuestions, setEditingAnamnesisQuestions] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('assistant_prompts')
        .select('*')
        .order('name');

      if (error) throw error;
      const typedData = (data || []).map(p => ({
        ...p,
        status: p.status as 'draft' | 'active' | 'archived'
      }));
      setPrompts(typedData);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error("Erro ao carregar prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (prompt: AssistantPrompt, newData: Partial<AssistantPrompt>) => {
    try {
      if (newData.status === 'active') {
        await supabase
          .from('assistant_prompts')
          .update({ status: 'archived' })
          .eq('assistant_key', prompt.assistant_key)
          .eq('status', 'active')
          .neq('id', prompt.id);
      }

      const { error } = await supabase
        .from('assistant_prompts')
        .update({
          ...newData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prompt.id);

      if (error) throw error;

      toast.success("Prompt salvo com sucesso!");
      loadPrompts();
      setEditingPrompt(null);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error("Erro ao salvar prompt");
    }
  };

  const handleCreateVersion = async (basePrompt: AssistantPrompt, newData: Partial<AssistantPrompt>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (newData.status === 'active') {
        await supabase
          .from('assistant_prompts')
          .update({ status: 'archived' })
          .eq('assistant_key', basePrompt.assistant_key)
          .eq('status', 'active');
      }

      const { error } = await supabase
        .from('assistant_prompts')
        .insert({
          assistant_key: basePrompt.assistant_key,
          name: basePrompt.name,
          description: basePrompt.description,
          system_prompt: newData.system_prompt || basePrompt.system_prompt,
          version: newData.version || basePrompt.version,
          version_notes: newData.version_notes,
          status: newData.status || 'draft',
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success("Nova versão criada com sucesso!");
      loadPrompts();
      setEditingPrompt(null);
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error("Erro ao criar versão");
    }
  };

  // Get prompt by key with filter applied
  const getPromptByKey = (key: string | null): AssistantPrompt | null => {
    if (!key) return null;
    
    const matchingPrompts = prompts.filter(p => p.assistant_key === key);
    if (matchingPrompts.length === 0) return null;
    
    // Apply status filter
    const filtered = filter === 'all' 
      ? matchingPrompts 
      : matchingPrompts.filter(p => p.status === filter);
    
    if (filtered.length === 0) return null;
    
    // Prefer active, then most recent
    return filtered.find(p => p.status === 'active') || filtered[0];
  };

  const renderPromptCard = (prompt: AssistantPrompt | null, type: 'chat' | 'report', moduleInfo: typeof promptPairs[0]) => {
    if (!prompt) {
      if (type === 'chat' && moduleInfo.chatKey === null) {
        // Special clickable card for Anamnese - opens questions editor
        return (
          <Card 
            className="p-4 bg-muted/30 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setEditingAnamnesisQuestions(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Formulário de Anamnese</p>
                  <p className="text-xs text-muted-foreground">Clique para editar as perguntas</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      }
      
      // No prompt found (filtered out or doesn't exist)
      return (
        <Card className="p-4 border-dashed opacity-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {type === 'chat' ? (
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              ) : (
                <FileText className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Prompt não encontrado</p>
          </div>
        </Card>
      );
    }

    const StatusIcon = statusConfig[prompt.status].icon;
    const versions = prompts.filter(p => p.assistant_key === prompt.assistant_key);

    return (
      <Card 
        className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => setEditingPrompt(prompt)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground truncate">{prompt.name}</h4>
              <Badge className={`${statusConfig[prompt.status].color} text-xs`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[prompt.status].label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {prompt.version}
              </Badge>
              {versions.length > 1 && (
                <span>{versions.length} versões</span>
              )}
              <span className="truncate">
                {format(new Date(prompt.updated_at), "dd/MM", { locale: ptBR })}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (editingAnamnesisQuestions) {
    return (
      <AnamnesisQuestionsEditor
        onClose={() => setEditingAnamnesisQuestions(false)}
      />
    );
  }

  if (editingPrompt) {
    return (
      <PromptEditor
        prompt={editingPrompt}
        allVersions={prompts.filter(p => p.assistant_key === editingPrompt.assistant_key)}
        onSave={(data) => handleSave(editingPrompt, data)}
        onCreateVersion={(data) => handleCreateVersion(editingPrompt, data)}
        onClose={() => setEditingPrompt(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Prompt Hub</h2>
          <p className="text-muted-foreground">Gerencie os prompts dos assistentes</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'draft', 'archived'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'Todos' : statusConfig[status as keyof typeof statusConfig].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Two-column header */}
      <div className="grid grid-cols-[200px_1fr_1fr] gap-4 items-center px-2">
        <div className="text-sm font-medium text-muted-foreground">Módulo</div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          Assistente de Chat
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FileText className="w-4 h-4" />
          Gerador de Relatório
        </div>
      </div>

      {/* Module rows */}
      <div className="space-y-3">
        {promptPairs.map((pair) => {
          const chatPrompt = getPromptByKey(pair.chatKey);
          const reportPrompt = getPromptByKey(pair.reportKey);
          
          // Check if row should be hidden based on filter
          const hasVisiblePrompt = filter === 'all' || chatPrompt || reportPrompt;
          
          if (!hasVisiblePrompt && pair.chatKey !== null) {
            return null;
          }

          return (
            <div 
              key={pair.module} 
              className="grid grid-cols-[200px_1fr_1fr] gap-4 items-stretch"
            >
              {/* Module label */}
              <div className="flex items-center gap-2 px-2">
                <span className="text-xl">{pair.emoji}</span>
                <span className="font-medium text-foreground">{pair.module}</span>
              </div>
              
              {/* Chat prompt card */}
              {renderPromptCard(chatPrompt, 'chat', pair)}
              
              {/* Report prompt card */}
              {renderPromptCard(reportPrompt, 'report', pair)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
