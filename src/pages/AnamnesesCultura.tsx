import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MicroChat } from "@/components/MicroChat";
import { useConfetti } from "@/hooks/useConfetti";

type AnamnesisQuestion = {
  id: string;
  step_number: number;
  field_key: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  options: { label: string; value: string }[] | null;
  is_required: boolean;
  display_order: number;
  microchat_prompt: string | null;
  is_core: boolean;
};

type AnamnesisData = Record<string, any>;

const STEPS = [
  { id: 1, title: "Cabeçalho", description: "Dados básicos da empresa" },
  { id: 2, title: "História", description: "Origem e contexto" },
  { id: 3, title: "Estrutura", description: "Organização e apoios" },
  { id: 4, title: "Liderança", description: "Pessoas e comunicação" },
  { id: 5, title: "Finanças", description: "Gestão financeira" },
  { id: 6, title: "Clientes", description: "Mercado e vendas" },
  { id: 7, title: "Direção", description: "Futuro e inovação" },
];

export default function AnamnesesCultura() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fireConfetti } = useConfetti();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [anamnesisId, setAnamnesisId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([]);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [formData, setFormData] = useState<AnamnesisData>({
    company_name: "",
    owner_name: "",
    owner_position: "",
    has_partners: false,
    segment: "",
    branches_count: 1,
  });

  useEffect(() => {
    loadQuestions();
    loadDraftAnamnesis();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("anamnesis_questions")
        .select("*")
        .eq("active", true)
        .order("step_number")
        .order("display_order");

      if (error) throw error;

      const formattedQuestions = (data || []).map(q => ({
        ...q,
        options: q.options as { label: string; value: string }[] | null
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Erro ao carregar perguntas",
        description: "Por favor, recarregue a página",
        variant: "destructive",
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadDraftAnamnesis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar anamnese existente
      const { data, error } = await supabase
        .from("organizational_anamnesis")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "draft")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAnamnesisId(data.id);
        // Merge data including extra_fields
        const extraFields = (data.extra_fields as Record<string, any>) || {};
        setFormData({ ...data, ...extraFields });
      } else {
        // Se não existe anamnese, buscar dados do MVV para pré-preencher
        const { data: mvvDoc } = await supabase
          .from("mvv_documents")
          .select("id, company_name, segment, company_size, company_context")
          .eq("user_id", user.id)
          .not("mission", "is", null) // MVV completado
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (mvvDoc) {
          setFormData(prev => ({
            ...prev,
            company_name: mvvDoc.company_name || "",
            segment: mvvDoc.segment !== "A definir" ? mvvDoc.segment : "",
            company_size: mvvDoc.company_size || "",
            founding_motivation: mvvDoc.company_context || "",
            mvv_document_id: mvvDoc.id,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  const autoSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Separate core fields from custom fields
      const coreFields = [
        "company_name", "owner_name", "owner_position", "has_partners", "partners_count",
        "segment", "employees_count", "leaders_count", "branches_count", "company_size",
        "business_origin", "founding_motivation", "products_services_description",
        "legal_structure", "annual_revenue_range", "main_sales_channels", "has_organogram",
        "outsourced_functions", "satisfied_with_partners", "leadership_clarity",
        "leadership_clarity_details", "self_leadership_rating", "self_leadership_reason",
        "team_understands_vision", "people_management_challenges", "finances_separated",
        "has_budget_and_cash_planning", "tracked_financial_metrics", "finance_tracking_method",
        "financial_literacy_rating", "ideal_customer_profile", "why_customers_buy",
        "sales_challenges", "tracks_sales_funnel", "vision_3_5_years", "main_goal_12_months",
        "main_frustrations", "innovation_readiness"
      ];

      const coreData: Record<string, any> = {};
      const extraFields: Record<string, any> = {};

      Object.entries(formData).forEach(([key, value]) => {
        if (coreFields.includes(key)) {
          coreData[key] = value;
        } else if (!["id", "user_id", "created_at", "updated_at", "status", "completed_at", "mvv_document_id", "extra_fields"].includes(key)) {
          extraFields[key] = value;
        }
      });

      const saveData = {
        ...coreData,
        extra_fields: Object.keys(extraFields).length > 0 ? extraFields : null,
        status: "draft"
      };

      if (anamnesisId) {
        const { error } = await supabase
          .from("organizational_anamnesis")
          .update(saveData)
          .eq("id", anamnesisId);

        if (error) throw error;
      } else {
        const insertData = { ...saveData, user_id: user.id } as any;
        const { data, error } = await supabase
          .from("organizational_anamnesis")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        if (data) setAnamnesisId(data.id);
      }
    } catch (error) {
      console.error("Error auto-saving:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.company_name && formData.owner_name && formData.segment) {
        autoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Salvar uma última vez antes de finalizar
      await autoSave();

      // Finalizar anamnese
      const { error: updateError } = await supabase
        .from("organizational_anamnesis")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", anamnesisId);

      if (updateError) throw updateError;

      // Gerar relatório
      await supabase.functions.invoke("generate-anamnesis-report", {
        body: { anamnesis_id: anamnesisId }
      });

      // Mostrar tela de celebração
      setShowCompletionScreen(true);
      fireConfetti("intense");

      // Segundo confetti após 1 segundo
      setTimeout(() => fireConfetti("normal"), 1000);

    } catch (error: any) {
      console.error("Error submitting anamnesis:", error);
      toast({
        title: "Erro ao concluir anamnese",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStepQuestions = (stepNumber: number) => {
    return questions.filter(q => q.step_number === stepNumber);
  };

  const renderField = (question: AnamnesisQuestion) => {
    const value = formData[question.field_key];

    switch (question.field_type) {
      case "text":
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.field_key}>
              {question.label} {question.is_required && "*"}
            </Label>
            <Input
              id={question.field_key}
              value={value || ""}
              onChange={(e) => updateField(question.field_key, e.target.value)}
              placeholder={question.placeholder || ""}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.field_key}>
              {question.label} {question.is_required && "*"}
            </Label>
            <Textarea
              id={question.field_key}
              value={value || ""}
              onChange={(e) => updateField(question.field_key, e.target.value)}
              placeholder={question.placeholder || ""}
              rows={3}
            />
          </div>
        );

      case "number":
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.field_key}>
              {question.label} {question.is_required && "*"}
            </Label>
            <Input
              id={question.field_key}
              type="number"
              value={value || ""}
              onChange={(e) => updateField(question.field_key, e.target.value ? parseInt(e.target.value) : "")}
              placeholder={question.placeholder || ""}
              className="w-full md:w-32"
            />
          </div>
        );

      case "select":
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.field_key}>
              {question.label} {question.is_required && "*"}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => updateField(question.field_key, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={question.placeholder || "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "boolean":
        return (
          <div key={question.id} className="space-y-2">
            <Label>{question.label} {question.is_required && "*"}</Label>
            <div className="flex gap-2 md:gap-4">
              <Button
                type="button"
                variant={value === true ? "default" : "outline"}
                onClick={() => updateField(question.field_key, true)}
                className="flex-1 text-sm md:text-base"
                size="sm"
              >
                Sim
              </Button>
              <Button
                type="button"
                variant={value === false ? "default" : "outline"}
                onClick={() => updateField(question.field_key, false)}
                className="flex-1 text-sm md:text-base"
                size="sm"
              >
                Não
              </Button>
            </div>
          </div>
        );

      case "microchat":
        return (
          <MicroChat
            key={question.id}
            label={question.label + (question.is_required ? " *" : "")}
            value={value || ""}
            onChange={(val) => updateField(question.field_key, val)}
            placeholder={question.placeholder || ""}
            systemPrompt={question.microchat_prompt || "Você é um consultor estratégico fazendo anamnese empresarial."}
          />
        );

      case "rating":
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.field_key}>
              {question.label} (1-10) {question.is_required && "*"}
            </Label>
            <Input
              id={question.field_key}
              type="number"
              min="1"
              max="10"
              value={value || ""}
              onChange={(e) => updateField(question.field_key, e.target.value ? parseInt(e.target.value) : "")}
              placeholder="1-10"
              className="w-24"
            />
          </div>
        );

      default:
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.field_key}>
              {question.label} {question.is_required && "*"}
            </Label>
            <Input
              id={question.field_key}
              value={value || ""}
              onChange={(e) => updateField(question.field_key, e.target.value)}
              placeholder={question.placeholder || ""}
            />
          </div>
        );
    }
  };

  const renderStepContent = () => {
    const stepQuestions = getStepQuestions(currentStep);

    if (stepQuestions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma pergunta configurada para esta etapa.
        </div>
      );
    }

    // Group number fields that can be side by side
    const numberFieldKeys = ["employees_count", "leaders_count"];
    const groupedQuestions: (AnamnesisQuestion | AnamnesisQuestion[])[] = [];
    let i = 0;

    while (i < stepQuestions.length) {
      const current = stepQuestions[i];
      const next = stepQuestions[i + 1];

      // Check if current and next are both number fields that should be grouped
      if (
        current.field_type === "number" &&
        next?.field_type === "number" &&
        numberFieldKeys.includes(current.field_key) &&
        numberFieldKeys.includes(next.field_key)
      ) {
        groupedQuestions.push([current, next]);
        i += 2;
      } else {
        groupedQuestions.push(current);
        i++;
      }
    }

    return (
      <div className="space-y-4 md:space-y-6">
        {groupedQuestions.map((item, index) => {
          if (Array.isArray(item)) {
            return (
              <div key={`group-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.map(q => renderField(q))}
              </div>
            );
          }
          return renderField(item);
        })}
      </div>
    );
  };

  const progress = (currentStep / STEPS.length) * 100;
  
  const canProceed = () => {
    const stepQuestions = getStepQuestions(currentStep);
    const requiredQuestions = stepQuestions.filter(q => q.is_required);
    
    return requiredQuestions.every(q => {
      const value = formData[q.field_key];
      return value !== undefined && value !== null && value !== "";
    });
  };

  // Completion screen
  if (showCompletionScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Parabéns! 🎉
              </h1>
              <p className="text-lg text-primary font-medium">
                Anamnese Concluída!
              </p>
              <p className="text-muted-foreground text-sm md:text-base">
                Seu diagnóstico organizacional foi salvo com sucesso. 
                Agora vamos criar o Código de Cultura da sua empresa.
              </p>
            </div>

            <Button 
              onClick={() => navigate("/novo-cultura")}
              size="lg"
              className="w-full text-base"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Iniciar Código de Cultura
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 md:py-8">
      <div className="container max-w-[95vw] md:max-w-3xl mx-auto px-2 md:px-4">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Anamnese Máxima</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Diagnóstico inicial consultivo da sua empresa
          </p>
        </div>

        <div className="mb-4 md:mb-8">
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <span className="text-xs md:text-sm font-medium">
              Etapa {currentStep} de {STEPS.length}
            </span>
            <span className="text-xs md:text-sm text-muted-foreground">
              {saving ? "Salvando..." : "Salvo automaticamente"}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators - numbers only on mobile, full titles on desktop */}
          <div className="flex justify-between mt-2 overflow-x-auto">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-xs flex-shrink-0 px-1 ${
                  step.id === currentStep
                    ? "text-primary font-medium"
                    : step.id < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <span className="md:hidden">{step.id}</span>
                <span className="hidden md:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <CardTitle className="text-lg md:text-xl">{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription className="text-xs md:text-sm">{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {renderStepContent()}

            <div className="flex justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                size="sm"
                className="text-xs md:text-sm"
              >
                <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="sm"
                  className="text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <span className="sm:hidden">Avançar</span>
                  <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  size="sm"
                  className="text-xs md:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      <span className="hidden sm:inline">Finalizando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Concluir Anamnese</span>
                      <span className="sm:hidden">Concluir</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
