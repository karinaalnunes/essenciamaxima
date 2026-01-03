import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Edit, Clock, CheckCircle, Archive, Plus } from "lucide-react";
import { PromptEditor } from "./PromptEditor";
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

export function PromptManager() {
  const [prompts, setPrompts] = useState<AssistantPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<AssistantPrompt | null>(null);
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
      // Cast status to the correct type
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
      // If activating this version, deactivate others with same key
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
      
      // If activating, archive the current active one
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

  const filteredPrompts = prompts.filter(p => 
    filter === 'all' ? true : p.status === filter
  );

  // Group by assistant_key and show only the latest active or most recent
  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    const existing = acc.find(p => p.assistant_key === prompt.assistant_key);
    if (!existing) {
      acc.push(prompt);
    } else if (prompt.status === 'active' && existing.status !== 'active') {
      acc[acc.indexOf(existing)] = prompt;
    }
    return acc;
  }, [] as AssistantPrompt[]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
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
      <div className="flex items-center justify-between">
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

      {groupedPrompts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum prompt encontrado</h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'Os prompts serão migrados automaticamente ao carregar.'
              : `Não há prompts com status "${statusConfig[filter as keyof typeof statusConfig].label}".`
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groupedPrompts.map((prompt) => {
            const StatusIcon = statusConfig[prompt.status].icon;
            const versions = prompts.filter(p => p.assistant_key === prompt.assistant_key);
            
            return (
              <Card 
                key={prompt.id} 
                className="p-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setEditingPrompt(prompt)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{prompt.name}</h3>
                      <Badge className={statusConfig[prompt.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[prompt.status].label}
                      </Badge>
                      <Badge variant="outline">
                        {prompt.version}
                      </Badge>
                      {versions.length > 1 && (
                        <Badge variant="secondary">
                          {versions.length} versões
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {prompt.description || `Prompt do assistente ${prompt.assistant_key}`}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Atualizado: {format(new Date(prompt.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span>
                        {prompt.system_prompt.length.toLocaleString()} caracteres
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
