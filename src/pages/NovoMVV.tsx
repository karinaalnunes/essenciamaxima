import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo-maxima-ia.png";
import { useToast } from "@/hooks/use-toast";

const STEPS = ["Sobre a Empresa", "Tom e Valores", "Gerar MVV"];

export default function NovoMVV() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    companyName: "",
    segment: "",
    companySize: "",
    targetAudience: "",
    purpose: "",
    toneOfVoice: "",
    desiredValues: "",
  });

  const [generatedMVV, setGeneratedMVV] = useState({
    mission: "",
    vision: "",
    values: [] as { title: string; description: string }[],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-mvv", {
        body: { ...formData },
      });

      if (error) throw error;

      setGeneratedMVV({
        mission: data.mission,
        vision: data.vision,
        values: data.values,
      });

      toast({
        title: "MVV gerado com sucesso!",
        description: "Revise e salve quando estiver pronto.",
      });
    } catch (error) {
      console.error("Erro ao gerar MVV:", error);
      toast({
        title: "Erro ao gerar MVV",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.from("mvv_documents").insert({
        user_id: userId,
        title: `MVV - ${formData.companyName}`,
        company_name: formData.companyName,
        segment: formData.segment,
        company_size: formData.companySize,
        target_audience: formData.targetAudience,
        purpose: formData.purpose,
        tone_of_voice: formData.toneOfVoice,
        desired_values: formData.desiredValues.split(",").map((v) => v.trim()),
        mission: generatedMVV.mission,
        vision: generatedMVV.vision,
        values: generatedMVV.values,
      });

      if (error) throw error;

      toast({
        title: "Documento salvo!",
        description: "Seu MVV foi salvo com sucesso.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-8 antialiased">
      <header className="max-w-4xl mx-auto mb-8">
        <img src={logo} alt="Máxima iA" className="h-12 w-auto" />
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-8">
          {/* Progress */}
          <div className="flex justify-between items-center">
            {STEPS.map((step, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div
                  className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    idx <= currentStep ? "bg-primary text-white" : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <p className={`text-sm ${idx <= currentStep ? "text-white" : "text-slate-400"}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Step 0: Sobre a Empresa */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Conte-nos sobre sua empresa</h2>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Nome da sua empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment">Segmento de atuação</Label>
                <Input
                  id="segment"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  placeholder="Ex: Tecnologia, Varejo, Serviços"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Porte da empresa</Label>
                <Input
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  placeholder="Ex: Startup, PME, Grande Empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Público-alvo</Label>
                <Textarea
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Descreva quem são seus clientes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Propósito da empresa</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Por que sua empresa existe?"
                />
              </div>
            </div>
          )}

          {/* Step 1: Tom e Valores */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Tom de voz e valores</h2>
              <div className="space-y-2">
                <Label htmlFor="toneOfVoice">Tom de voz desejado</Label>
                <Input
                  id="toneOfVoice"
                  value={formData.toneOfVoice}
                  onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                  placeholder="Ex: Profissional, Inovador, Humanizado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desiredValues">Valores importantes (separe por vírgula)</Label>
                <Textarea
                  id="desiredValues"
                  value={formData.desiredValues}
                  onChange={(e) => setFormData({ ...formData, desiredValues: e.target.value })}
                  placeholder="Ex: Inovação, Transparência, Excelência, Colaboração"
                />
              </div>
            </div>
          )}

          {/* Step 2: Gerar MVV */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Seu MVV gerado por IA</h2>
              
              {!generatedMVV.mission ? (
                <div className="text-center py-12 space-y-4">
                  <p className="text-slate-300">
                    Clique no botão abaixo para gerar sua Missão, Visão e Valores
                  </p>
                  <Button onClick={handleGenerate} disabled={generating} size="lg">
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      "Gerar MVV com IA"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Missão</Label>
                    <Textarea
                      value={generatedMVV.mission}
                      onChange={(e) => setGeneratedMVV({ ...generatedMVV, mission: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Visão</Label>
                    <Textarea
                      value={generatedMVV.vision}
                      onChange={(e) => setGeneratedMVV({ ...generatedMVV, vision: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Valores</Label>
                    {generatedMVV.values.map((value, idx) => (
                      <div key={idx} className="space-y-2">
                        <Input
                          value={value.title}
                          onChange={(e) => {
                            const newValues = [...generatedMVV.values];
                            newValues[idx].title = e.target.value;
                            setGeneratedMVV({ ...generatedMVV, values: newValues });
                          }}
                        />
                        <Textarea
                          value={value.description}
                          onChange={(e) => {
                            const newValues = [...generatedMVV.values];
                            newValues[idx].description = e.target.value;
                            setGeneratedMVV({ ...generatedMVV, values: newValues });
                          }}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={handleGenerate} variant="outline" disabled={generating}>
                      Regenerar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : "Salvar Documento"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-slate-700">
            <Button
              onClick={() => currentStep === 0 ? navigate("/dashboard") : handleBack()}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 0 ? "Cancelar" : "Voltar"}
            </Button>
            {currentStep < 2 && (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}