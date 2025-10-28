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
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MicroChat } from "@/components/MicroChat";

type AnamnesisData = {
  company_name: string;
  owner_name: string;
  owner_position: string;
  has_partners: boolean;
  partners_count?: number;
  segment: string;
  employees_count?: number;
  leaders_count?: number;
  branches_count: number;
  company_size?: string;
  business_origin?: string;
  founding_motivation?: string;
  products_services_description?: string;
  legal_structure?: string;
  annual_revenue_range?: string;
  main_sales_channels?: string;
  has_organogram?: string;
  outsourced_functions?: string;
  satisfied_with_partners?: string;
  leadership_clarity?: string;
  leadership_clarity_details?: string;
  self_leadership_rating?: number;
  self_leadership_reason?: string;
  team_understands_vision?: string;
  people_management_challenges?: string;
  finances_separated?: boolean;
  has_budget_and_cash_planning?: string;
  tracked_financial_metrics?: string;
  finance_tracking_method?: string;
  financial_literacy_rating?: number;
  ideal_customer_profile?: string;
  why_customers_buy?: string;
  sales_challenges?: string;
  tracks_sales_funnel?: string;
  vision_3_5_years?: string;
  main_goal_12_months?: string;
  main_frustrations?: string;
  innovation_readiness?: string;
};

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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anamnesisId, setAnamnesisId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnamnesisData>({
    company_name: "",
    owner_name: "",
    owner_position: "",
    has_partners: false,
    segment: "",
    branches_count: 1,
  });

  useEffect(() => {
    loadDraftAnamnesis();
  }, []);

  const loadDraftAnamnesis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("organizational_anamnesis")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "draft")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAnamnesisId(data.id);
        setFormData(data as AnamnesisData);
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

      if (anamnesisId) {
        const { error } = await supabase
          .from("organizational_anamnesis")
          .update({ ...formData, status: "draft" })
          .eq("id", anamnesisId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("organizational_anamnesis")
          .insert({ ...formData, user_id: user.id, status: "draft" })
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

      // Finalizar anamnese
      const { error: updateError } = await supabase
        .from("organizational_anamnesis")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", anamnesisId);

      if (updateError) throw updateError;

      toast({
        title: "Anamnese Concluída! 🎉",
        description: "Gerando seu relatório de diagnóstico...",
      });

      // Gerar relatório
      const { data: reportData, error: reportError } = await supabase.functions.invoke("generate-anamnesis-report", {
        body: { anamnesis_id: anamnesisId }
      });

      if (reportError) throw reportError;

      toast({
        title: "Relatório Gerado!",
        description: "Redirecionando para o Código de Cultura Máxima...",
      });

      setTimeout(() => {
        navigate("/novo-cultura");
      }, 2000);
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

  const updateField = (field: keyof AnamnesisData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="Ex: Máxima IA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_name">Nome do proprietário principal *</Label>
              <Input
                id="owner_name"
                value={formData.owner_name}
                onChange={(e) => updateField("owner_name", e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_position">Sua posição na empresa *</Label>
              <Input
                id="owner_position"
                value={formData.owner_position}
                onChange={(e) => updateField("owner_position", e.target.value)}
                placeholder="Ex: CEO, Sócio-Diretor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Segmento / Ramo de atividade *</Label>
              <Input
                id="segment"
                value={formData.segment}
                onChange={(e) => updateField("segment", e.target.value)}
                placeholder="Ex: Tecnologia, Varejo, Serviços"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employees_count">Nº de colaboradores</Label>
                <Input
                  id="employees_count"
                  type="number"
                  value={formData.employees_count || ""}
                  onChange={(e) => updateField("employees_count", parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaders_count">Nº de líderes</Label>
                <Input
                  id="leaders_count"
                  type="number"
                  value={formData.leaders_count || ""}
                  onChange={(e) => updateField("leaders_count", parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Porte da empresa</Label>
              <Select value={formData.company_size} onValueChange={(value) => updateField("company_size", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o porte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="ME">ME - Microempresa</SelectItem>
                  <SelectItem value="EPP">EPP - Empresa de Pequeno Porte</SelectItem>
                  <SelectItem value="Médio">Médio Porte</SelectItem>
                  <SelectItem value="Grande">Grande Porte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_origin">Como o negócio começou?</Label>
              <Select value={formData.business_origin} onValueChange={(value) => updateField("business_origin", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundado">Fundado por mim</SelectItem>
                  <SelectItem value="herdado">Herdado</SelectItem>
                  <SelectItem value="adquirido">Adquirido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <MicroChat
              label="O que motivou você a assumir ou fundar essa empresa?"
              value={formData.founding_motivation || ""}
              onChange={(value) => updateField("founding_motivation", value)}
              placeholder="Compartilhe sua história..."
              systemPrompt="Você é um consultor estratégico fazendo anamnese empresarial. Faça follow-ups empáticos e consultivos sobre a motivação do empresário."
            />

            <div className="space-y-2">
              <Label htmlFor="products_services_description">Produtos/serviços que oferece</Label>
              <Textarea
                id="products_services_description"
                value={formData.products_services_description || ""}
                onChange={(e) => updateField("products_services_description", e.target.value)}
                placeholder="Descreva brevemente..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_structure">Estrutura legal atual</Label>
              <Select value={formData.legal_structure} onValueChange={(value) => updateField("legal_structure", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  <SelectItem value="Não sei">Não sei</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_revenue_range">Receita anual aproximada</Label>
              <Select value={formData.annual_revenue_range} onValueChange={(value) => updateField("annual_revenue_range", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma faixa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Até R$ 360 mil">Até R$ 360 mil</SelectItem>
                  <SelectItem value="R$ 360 mil - R$ 4,8 milhões">R$ 360 mil - R$ 4,8 milhões</SelectItem>
                  <SelectItem value="R$ 4,8 milhões - R$ 300 milhões">R$ 4,8 milhões - R$ 300 milhões</SelectItem>
                  <SelectItem value="Acima de R$ 300 milhões">Acima de R$ 300 milhões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_sales_channels">Principais canais de venda</Label>
              <Textarea
                id="main_sales_channels"
                value={formData.main_sales_channels || ""}
                onChange={(e) => updateField("main_sales_channels", e.target.value)}
                placeholder="Ex: Loja física, e-commerce, representantes..."
                rows={2}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="has_organogram">Você já tem um organograma definido?</Label>
              <Select value={formData.has_organogram} onValueChange={(value) => updateField("has_organogram", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outsourced_functions">Funções terceirizadas essenciais</Label>
              <Textarea
                id="outsourced_functions"
                value={formData.outsourced_functions || ""}
                onChange={(e) => updateField("outsourced_functions", e.target.value)}
                placeholder="Ex: contabilidade, jurídico, marketing, TI..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="satisfied_with_partners">Está satisfeito com esses parceiros?</Label>
              <Select value={formData.satisfied_with_partners} onValueChange={(value) => updateField("satisfied_with_partners", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="parcial">Parcialmente</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <MicroChat
              label="Você tem clareza sobre a direção geral da sua empresa?"
              value={formData.leadership_clarity || ""}
              onChange={(value) => updateField("leadership_clarity", value)}
              placeholder="Compartilhe sua visão..."
              systemPrompt="Você é um consultor estratégico. Se o empresário demonstrar falta de clareza, faça perguntas aprofundadas sobre o que falta para ter essa direção definida."
              triggerFollowUp={(response) => {
                const lower = response.toLowerCase();
                return lower.includes("não") || lower.includes("parcial") || lower.includes("dúvida");
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="self_leadership_rating">Como você se avalia como líder? (1-10)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="self_leadership_rating"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.self_leadership_rating || ""}
                  onChange={(e) => updateField("self_leadership_rating", parseInt(e.target.value))}
                  placeholder="1-10"
                  className="w-24"
                />
                <Input
                  id="self_leadership_reason"
                  value={formData.self_leadership_reason || ""}
                  onChange={(e) => updateField("self_leadership_reason", e.target.value)}
                  placeholder="Por quê?"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_understands_vision">Sua equipe entende a visão da empresa?</Label>
              <Select value={formData.team_understands_vision} onValueChange={(value) => updateField("team_understands_vision", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="parcial">Parcialmente</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="people_management_challenges">Maiores desafios na gestão de pessoas (até 3)</Label>
              <Textarea
                id="people_management_challenges"
                value={formData.people_management_challenges || ""}
                onChange={(e) => updateField("people_management_challenges", e.target.value)}
                placeholder="Liste os principais desafios..."
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Finanças pessoais e da empresa estão:</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.finances_separated === true ? "default" : "outline"}
                  onClick={() => updateField("finances_separated", true)}
                  className="flex-1"
                >
                  Separadas
                </Button>
                <Button
                  type="button"
                  variant={formData.finances_separated === false ? "default" : "outline"}
                  onClick={() => updateField("finances_separated", false)}
                  className="flex-1"
                >
                  Misturadas
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="has_budget_and_cash_planning">Possui orçamento e planejamento de caixa?</Label>
              <Select value={formData.has_budget_and_cash_planning} onValueChange={(value) => updateField("has_budget_and_cash_planning", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="parcial">Parcialmente</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracked_financial_metrics">Principais métricas financeiras que acompanha</Label>
              <Textarea
                id="tracked_financial_metrics"
                value={formData.tracked_financial_metrics || ""}
                onChange={(e) => updateField("tracked_financial_metrics", e.target.value)}
                placeholder="Ex: faturamento, lucro líquido, margem..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finance_tracking_method">Como acompanha as finanças hoje?</Label>
              <Input
                id="finance_tracking_method"
                value={formData.finance_tracking_method || ""}
                onChange={(e) => updateField("finance_tracking_method", e.target.value)}
                placeholder="Ex: sistema ERP, planilhas, software específico..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial_literacy_rating">Capacidade de entender relatórios financeiros (1-10)</Label>
              <Input
                id="financial_literacy_rating"
                type="number"
                min="1"
                max="10"
                value={formData.financial_literacy_rating || ""}
                onChange={(e) => updateField("financial_literacy_rating", parseInt(e.target.value))}
                placeholder="1-10"
                className="w-24"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ideal_customer_profile">Quem é o seu cliente ideal?</Label>
              <Textarea
                id="ideal_customer_profile"
                value={formData.ideal_customer_profile || ""}
                onChange={(e) => updateField("ideal_customer_profile", e.target.value)}
                placeholder="Descreva o perfil do seu cliente ideal..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="why_customers_buy">Por que eles compram de você?</Label>
              <Textarea
                id="why_customers_buy"
                value={formData.why_customers_buy || ""}
                onChange={(e) => updateField("why_customers_buy", e.target.value)}
                placeholder="Qual o diferencial que atrai seus clientes?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales_challenges">Maiores desafios em vendas ou atração de clientes</Label>
              <Textarea
                id="sales_challenges"
                value={formData.sales_challenges || ""}
                onChange={(e) => updateField("sales_challenges", e.target.value)}
                placeholder="Liste os principais desafios..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracks_sales_funnel">Acompanha o funil de vendas?</Label>
              <Select value={formData.tracks_sales_funnel} onValueChange={(value) => updateField("tracks_sales_funnel", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vision_3_5_years">Onde gostaria que a empresa estivesse em 3-5 anos?</Label>
              <Textarea
                id="vision_3_5_years"
                value={formData.vision_3_5_years || ""}
                onChange={(e) => updateField("vision_3_5_years", e.target.value)}
                placeholder="Descreva sua visão de futuro..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_goal_12_months">Objetivo mais importante para os próximos 12 meses</Label>
              <Textarea
                id="main_goal_12_months"
                value={formData.main_goal_12_months || ""}
                onChange={(e) => updateField("main_goal_12_months", e.target.value)}
                placeholder="Qual é a prioridade número 1?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_frustrations">Suas maiores frustrações como empresário (até 3)</Label>
              <Textarea
                id="main_frustrations"
                value={formData.main_frustrations || ""}
                onChange={(e) => updateField("main_frustrations", e.target.value)}
                placeholder="Seja honesto sobre o que mais te frustra..."
                rows={3}
              />
            </div>

            <MicroChat
              label="Quão preparada sua empresa está para inovar e se adaptar?"
              value={formData.innovation_readiness || ""}
              onChange={(value) => updateField("innovation_readiness", value)}
              placeholder="Reflita sobre a capacidade de inovação..."
              systemPrompt="Você é um consultor estratégico. Explore a prontidão da empresa para mudanças e inovação. Pergunte sobre resistências e apoiadores."
              triggerFollowUp={(response) => response.length < 100}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;
  const canProceed = () => {
    if (currentStep === 1) {
      return formData.company_name && formData.owner_name && formData.owner_position && formData.segment;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Anamnese Máxima</h1>
          <p className="text-muted-foreground">
            Diagnóstico inicial consultivo da sua empresa
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">
              Etapa {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {saving ? "Salvando..." : "Salvo automaticamente"}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-xs ${
                  step.id === currentStep
                    ? "text-primary font-medium"
                    : step.id < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Concluir Anamnese
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
