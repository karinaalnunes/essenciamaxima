import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { getDeviceInfo, getLocationInfo, getMarketingInfo, getTimeOnPage } from "@/lib/leadCapture";

export default function Capturar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    segment: "",
    consentLgpd: false,
  });
  const [enrichedData, setEnrichedData] = useState({
    device: null as any,
    location: null as any,
    marketing: null as any,
  });

  // Capturar dados automaticamente ao carregar a página
  useEffect(() => {
    // Capturar dados do dispositivo imediatamente
    const deviceInfo = getDeviceInfo();
    const marketingInfo = getMarketingInfo();
    
    // Capturar localização (assíncrono)
    getLocationInfo().then(locationInfo => {
      setEnrichedData({
        device: deviceInfo,
        location: locationInfo,
        marketing: marketingInfo,
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consentLgpd) {
      toast({
        title: "Consentimento necessário",
        description: "Por favor, aceite os termos da LGPD para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Capturar UTM params da URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const utmMedium = urlParams.get("utm_medium");
      const utmCampaign = urlParams.get("utm_campaign");

      // Validar telefone (mínimo 10 dígitos)
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        toast({
          title: "Telefone inválido",
          description: "Por favor, insira um telefone válido com pelo menos 10 dígitos.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Salvar lead via edge function (secure)
      const { data: leadResponse, error: leadError } = await supabase.functions.invoke("capture-lead", {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          segment: formData.segment,
          consent_lgpd: formData.consentLgpd,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          // Dados automáticos de dispositivo
          browser: enrichedData.device?.browser,
          os: enrichedData.device?.os,
          device: enrichedData.device?.device,
          language: enrichedData.device?.language,
          screen_resolution: enrichedData.device?.screenResolution,
          // Dados de localização (sem salvar IP)
          city: enrichedData.location?.city,
          state: enrichedData.location?.state,
          country: enrichedData.location?.country,
          timezone: enrichedData.location?.timezone,
          // Dados de comportamento e marketing
          referrer: enrichedData.marketing?.referrer,
          time_on_page: getTimeOnPage(),
          gclid: enrichedData.marketing?.gclid,
          fbclid: enrichedData.marketing?.fbclid,
          landing_page: enrichedData.marketing?.landingPage,
        },
      });

      if (leadError) throw leadError;
      if (!leadResponse?.success) throw new Error(leadResponse?.error || "Erro ao salvar lead");

      // Salvar dados no sessionStorage para pré-preencher o cadastro
      sessionStorage.setItem("leadData", JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        segment: formData.segment,
      }));

      // Enviar mensagens de boas-vindas (email + WhatsApp)
      await supabase.functions.invoke("send-welcome-messages", {
        body: { 
          email: formData.email, 
          name: formData.name,
          phone: formData.phone 
        },
      });

      navigate("/obrigado");
    } catch (error) {
      console.error("Erro ao capturar lead:", error);
      toast({
        title: "Erro ao processar cadastro",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-8 antialiased">
      <header className="max-w-2xl mx-auto mb-8">
        <Link to="/">
          <img src={logo} alt="Máxima iA" width="150" height="75" />
        </Link>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Comece a Criar seu <span className="bg-gradient-text bg-clip-text text-transparent">MVV</span>
            </h1>
            <p className="text-slate-300 text-lg">
              Preencha os dados abaixo para acessar a ferramenta gratuita
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone/WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+55 11 98765-4321"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Nome da empresa</Label>
              <Input
                id="company"
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Sua empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Segmento de atuação</Label>
              <Input
                id="segment"
                type="text"
                required
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                placeholder="Ex: Tecnologia, Varejo, Serviços"
              />
            </div>

            <div className="flex items-start space-x-2 pt-4">
              <Checkbox
                id="consent"
                checked={formData.consentLgpd}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, consentLgpd: checked as boolean })
                }
              />
              <Label htmlFor="consent" className="text-sm text-slate-300 leading-relaxed cursor-pointer">
                Concordo com a coleta e tratamento dos meus dados pessoais de acordo com a LGPD e 
                aceito receber comunicações da Máxima iA.
              </Label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processando..." : "Acessar Ferramenta Grátis"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}