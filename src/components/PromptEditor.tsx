import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, Plus, Clock, CheckCircle, Archive, History } from "lucide-react";
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

interface PromptEditorProps {
  prompt: AssistantPrompt;
  allVersions: AssistantPrompt[];
  onSave: (data: Partial<AssistantPrompt>) => void;
  onCreateVersion: (data: Partial<AssistantPrompt>) => void;
  onClose: () => void;
}

const statusConfig = {
  active: { label: "Ativo", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  draft: { label: "Rascunho", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  archived: { label: "Arquivado", color: "bg-muted text-muted-foreground border-border", icon: Archive },
};

export function PromptEditor({ prompt, allVersions, onSave, onCreateVersion, onClose }: PromptEditorProps) {
  const [systemPrompt, setSystemPrompt] = useState(prompt.system_prompt);
  const [version, setVersion] = useState(prompt.version);
  const [versionNotes, setVersionNotes] = useState(prompt.version_notes || '');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>(prompt.status);
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);

  const hasChanges = systemPrompt !== prompt.system_prompt || 
                     version !== prompt.version || 
                     versionNotes !== (prompt.version_notes || '') ||
                     status !== prompt.status;

  const handleSave = () => {
    if (isCreatingNewVersion) {
      onCreateVersion({
        system_prompt: systemPrompt,
        version,
        version_notes: versionNotes,
        status,
      });
    } else {
      onSave({
        system_prompt: systemPrompt,
        version,
        version_notes: versionNotes,
        status,
      });
    }
  };

  const handleLoadVersion = (versionPrompt: AssistantPrompt) => {
    setSystemPrompt(versionPrompt.system_prompt);
    setVersion(versionPrompt.version);
    setVersionNotes(versionPrompt.version_notes || '');
    setStatus(versionPrompt.status);
    setIsCreatingNewVersion(false);
  };

  const sortedVersions = [...allVersions].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{prompt.name}</h2>
            <p className="text-muted-foreground">{prompt.description || prompt.assistant_key}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const nextVersion = `v${(parseFloat(version.replace('v', '')) + 0.1).toFixed(1)}`;
              setVersion(nextVersion);
              setVersionNotes('');
              setIsCreatingNewVersion(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Versão
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            {isCreatingNewVersion ? 'Criar Versão' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt" className="text-lg font-semibold">System Prompt</Label>
                <span className="text-xs text-muted-foreground">
                  {systemPrompt.length.toLocaleString()} caracteres
                </span>
              </div>
              <Textarea
                id="prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Digite o system prompt aqui..."
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Version Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Configurações</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v: 'draft' | 'active' | 'archived') => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Rascunho
                      </span>
                    </SelectItem>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" /> Ativo
                      </span>
                    </SelectItem>
                    <SelectItem value="archived">
                      <span className="flex items-center gap-2">
                        <Archive className="w-3 h-3" /> Arquivado
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {status === 'active' && prompt.status !== 'active' && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Ao ativar, a versão anterior será arquivada automaticamente.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas da Alteração</Label>
                <Textarea
                  id="notes"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="O que mudou nesta versão?"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Version History */}
          {sortedVersions.length > 1 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4" />
                <h3 className="font-semibold">Histórico</h3>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {sortedVersions.map((v, idx) => (
                  <AccordionItem key={v.id} value={v.id} className="border rounded-md px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[v.status].color} variant="outline">
                          {v.version}
                        </Badge>
                        {v.id === prompt.id && (
                          <span className="text-xs text-primary">(atual)</span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          {format(new Date(v.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {v.version_notes && (
                          <p className="text-foreground">{v.version_notes}</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleLoadVersion(v)}
                        >
                          Carregar esta versão
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
