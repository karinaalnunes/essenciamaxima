import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  MessageSquare,
  Type,
  AlignLeft,
  List,
  Hash,
  ToggleLeft,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface AnamnesisQuestion {
  id: string;
  step_number: number;
  field_key: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'microchat' | 'rating';
  label: string;
  placeholder: string | null;
  options: { value: string; label: string }[] | null;
  is_required: boolean;
  display_order: number;
  microchat_prompt: string | null;
  is_core: boolean;
  active: boolean;
}

interface Props {
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: "Cabeçalho", description: "Dados básicos" },
  { id: 2, title: "História", description: "Origem e contexto" },
  { id: 3, title: "Estrutura", description: "Organização" },
  { id: 4, title: "Liderança", description: "Pessoas" },
  { id: 5, title: "Finanças", description: "Gestão financeira" },
  { id: 6, title: "Clientes", description: "Mercado" },
  { id: 7, title: "Direção", description: "Futuro" },
];

const fieldTypeConfig = {
  text: { label: "Texto curto", icon: Type },
  textarea: { label: "Texto longo", icon: AlignLeft },
  select: { label: "Seleção", icon: List },
  number: { label: "Número", icon: Hash },
  boolean: { label: "Sim/Não", icon: ToggleLeft },
  microchat: { label: "MicroChat", icon: MessageSquare },
  rating: { label: "Avaliação 1-10", icon: Hash },
};

// Sortable Question Item Component
interface SortableQuestionItemProps {
  question: AnamnesisQuestion;
  isExpanded: boolean;
  onToggleExpand: (open: boolean) => void;
  onUpdateQuestion: (id: string, updates: Partial<AnamnesisQuestion>) => void;
  onUpdateOption: (questionId: string, optionIndex: number, field: 'value' | 'label', newValue: string) => void;
  onAddOption: (questionId: string) => void;
  onRemoveOption: (questionId: string, optionIndex: number) => void;
  onDeleteQuestion: (id: string) => void;
}

function SortableQuestionItem({
  question,
  isExpanded,
  onToggleExpand,
  onUpdateQuestion,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onDeleteQuestion,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible
        open={isExpanded}
        onOpenChange={onToggleExpand}
      >
        <div className={`border rounded-lg ${!question.active ? 'opacity-50 bg-muted/30' : ''} ${isDragging ? 'shadow-lg bg-background' : ''}`}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{question.label}</span>
                  {question.is_required && (
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  )}
                  {question.is_core && (
                    <Badge variant="secondary" className="text-xs">Essencial</Badge>
                  )}
                  {!question.active && (
                    <Badge variant="outline" className="text-xs">Inativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const Icon = fieldTypeConfig[question.field_type].icon;
                    return (
                      <>
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {fieldTypeConfig[question.field_type].label}
                        </span>
                      </>
                    );
                  })()}
                  <span className="text-xs text-muted-foreground">•</span>
                  <code className="text-xs text-muted-foreground">{question.field_key}</code>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t space-y-4">
              {/* Label */}
              <div className="space-y-2">
                <Label>Texto da pergunta</Label>
                <Input
                  value={question.label}
                  onChange={(e) => onUpdateQuestion(question.id, { label: e.target.value })}
                />
              </div>

              {/* Placeholder */}
              {question.field_type !== 'boolean' && (
                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={question.placeholder || ''}
                    onChange={(e) => onUpdateQuestion(question.id, { placeholder: e.target.value })}
                    placeholder="Texto de exemplo..."
                  />
                </div>
              )}

              {/* Options for select/boolean */}
              {(question.field_type === 'select' || question.field_type === 'boolean') && question.options && (
                <div className="space-y-2">
                  <Label>Opções</Label>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          value={option.value}
                          onChange={(e) => onUpdateOption(question.id, optIndex, 'value', e.target.value)}
                          placeholder="Valor"
                          className="w-1/3"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) => onUpdateOption(question.id, optIndex, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveOption(question.id, optIndex)}
                          className="shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddOption(question.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
              )}

              {/* MicroChat prompt */}
              {question.field_type === 'microchat' && (
                <div className="space-y-2">
                  <Label>Prompt do MicroChat</Label>
                  <Textarea
                    value={question.microchat_prompt || ''}
                    onChange={(e) => onUpdateQuestion(question.id, { microchat_prompt: e.target.value })}
                    placeholder="Instruções para o assistente de IA..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Define como a IA fará perguntas de follow-up neste campo.
                  </p>
                </div>
              )}

              {/* Field type (only for non-core questions) */}
              {!question.is_core && (
                <div className="space-y-2">
                  <Label>Tipo de campo</Label>
                  <Select
                    value={question.field_type}
                    onValueChange={(value) => onUpdateQuestion(question.id, { 
                      field_type: value as AnamnesisQuestion['field_type'],
                      options: value === 'select' ? [{ value: '', label: '' }] : null
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fieldTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={question.is_required}
                    onCheckedChange={(checked) => onUpdateQuestion(question.id, { is_required: checked })}
                  />
                  <Label className="cursor-pointer">Obrigatório</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={question.active}
                    onCheckedChange={(checked) => onUpdateQuestion(question.id, { active: checked })}
                  />
                  <Label className="cursor-pointer">Ativo</Label>
                </div>
              </div>

              {/* Delete button for non-core */}
              {!question.is_core && (
                <div className="pt-2 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteQuestion(question.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Pergunta
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

export function AnamnesisQuestionsEditor({ onClose }: Props) {
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState("1");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('anamnesis_questions')
        .select('*')
        .order('step_number')
        .order('display_order');

      if (error) throw error;
      
      setQuestions((data || []).map(q => ({
        ...q,
        field_type: q.field_type as AnamnesisQuestion['field_type'],
        options: q.options as { value: string; label: string }[] | null
      })));
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error("Erro ao carregar perguntas");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (id: string, updates: Partial<AnamnesisQuestion>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
    setHasChanges(true);
  };

  const updateOption = (questionId: string, optionIndex: number, field: 'value' | 'label', newValue: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId || !q.options) return q;
      const newOptions = [...q.options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: newValue };
      return { ...q, options: newOptions };
    }));
    setHasChanges(true);
  };

  const addOption = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const newOptions = [...(q.options || []), { value: "", label: "" }];
      return { ...q, options: newOptions };
    }));
    setHasChanges(true);
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId || !q.options) return q;
      const newOptions = q.options.filter((_, i) => i !== optionIndex);
      return { ...q, options: newOptions };
    }));
    setHasChanges(true);
  };

  const addQuestion = async () => {
    const stepNumber = parseInt(activeStep);
    const stepQuestions = questions.filter(q => q.step_number === stepNumber);
    const maxOrder = Math.max(0, ...stepQuestions.map(q => q.display_order));
    
    const newQuestion = {
      step_number: stepNumber,
      field_key: `custom_${Date.now()}`,
      field_type: 'text',
      label: 'Nova pergunta',
      placeholder: '',
      is_required: false,
      display_order: maxOrder + 1,
      is_core: false,
      active: true,
    };

    try {
      const { data, error } = await supabase
        .from('anamnesis_questions')
        .insert([newQuestion])
        .select()
        .single();

      if (error) throw error;
      
      setQuestions(prev => [...prev, {
        ...data,
        field_type: data.field_type as AnamnesisQuestion['field_type'],
        options: data.options as { value: string; label: string }[] | null
      }]);
      setExpandedQuestion(data.id);
      toast.success("Pergunta adicionada");
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error("Erro ao adicionar pergunta");
    }
  };

  const deleteQuestion = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question?.is_core) {
      toast.error("Perguntas essenciais não podem ser excluídas, apenas desativadas");
      return;
    }

    try {
      const { error } = await supabase
        .from('anamnesis_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success("Pergunta excluída");
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error("Erro ao excluir pergunta");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const stepNumber = parseInt(activeStep);
    const stepQuestions = getStepQuestions(stepNumber);
    
    const oldIndex = stepQuestions.findIndex(q => q.id === active.id);
    const newIndex = stepQuestions.findIndex(q => q.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedStepQuestions = arrayMove(stepQuestions, oldIndex, newIndex);
    
    // Update display_order for all questions in this step
    setQuestions(prev => {
      const otherQuestions = prev.filter(q => q.step_number !== stepNumber);
      const updatedStepQuestions = reorderedStepQuestions.map((q, index) => ({
        ...q,
        display_order: index + 1
      }));
      return [...otherQuestions, ...updatedStepQuestions];
    });
    
    setHasChanges(true);
    toast.info("Ordem atualizada - clique em 'Salvar' para confirmar");
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      for (const question of questions) {
        const { error } = await supabase
          .from('anamnesis_questions')
          .update({
            label: question.label,
            placeholder: question.placeholder,
            options: question.options,
            is_required: question.is_required,
            display_order: question.display_order,
            microchat_prompt: question.microchat_prompt,
            active: question.active,
          })
          .eq('id', question.id);

        if (error) throw error;
      }
      
      toast.success("Alterações salvas com sucesso!");
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const getStepQuestions = (stepNumber: number) => {
    return questions
      .filter(q => q.step_number === stepNumber)
      .sort((a, b) => a.display_order - b.display_order);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Perguntas da Anamnese</h2>
            <p className="text-muted-foreground">Edite as perguntas do formulário de diagnóstico</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Alterações não salvas
            </Badge>
          )}
          <Button onClick={saveAllChanges} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Tabs for steps */}
      <Tabs value={activeStep} onValueChange={setActiveStep}>
        <TabsList className="grid grid-cols-7 w-full">
          {STEPS.map((step) => (
            <TabsTrigger key={step.id} value={String(step.id)} className="text-xs">
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{step.id}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {STEPS.map((step) => {
          const stepQuestions = getStepQuestions(step.id);
          
          return (
            <TabsContent key={step.id} value={String(step.id)} className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stepQuestions.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={stepQuestions.map(q => q.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {stepQuestions.map((question) => (
                          <SortableQuestionItem
                            key={question.id}
                            question={question}
                            isExpanded={expandedQuestion === question.id}
                            onToggleExpand={(open) => setExpandedQuestion(open ? question.id : null)}
                            onUpdateQuestion={updateQuestion}
                            onUpdateOption={updateOption}
                            onAddOption={addOption}
                            onRemoveOption={removeOption}
                            onDeleteQuestion={deleteQuestion}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma pergunta nesta etapa.</p>
                      <Button onClick={addQuestion} variant="link" className="mt-2">
                        Adicionar primeira pergunta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
