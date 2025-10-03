import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo-maxima-ia.png";

export default function TrialComplete() {
  const navigate = useNavigate();

  const handleContactSales = () => {
    const email = "contato@maximaia.com.br";
    const subject = "Interesse em mais MVVs";
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      window.location.href = mailtoLink;
      toast({
        title: "Abrindo cliente de email",
        description: `Entrando em contato com ${email}`,
      });
    } catch (error) {
      toast({
        title: "Email de contato",
        description: `Entre em contato através do email: ${email}`,
        variant: "default",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-8 antialiased">
      <header className="max-w-4xl mx-auto mb-12">
        <img src={logo} alt="Máxima iA" className="h-12 w-auto" />
      </header>

      <main className="max-w-2xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700/50 p-12 text-center space-y-6">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">
              Trial Concluído com Sucesso!
            </h1>
            <p className="text-slate-300 text-lg">
              Você já criou seu MVV gratuito com a Máxima iA.
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 space-y-4 border border-slate-700/50">
            <p className="text-slate-200">
              🎉 Parabéns por ter criado a Missão, Visão e Valores da sua empresa!
            </p>
            <p className="text-slate-300 text-sm">
              Cada usuário tem direito a <strong className="text-white">um MVV gratuito</strong> durante o período de trial. 
              Para criar novos documentos MVV ou acessar funcionalidades adicionais, entre em contato com nossa equipe comercial.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={handleContactSales}
              size="lg"
              className="bg-gradient-cta gap-2"
            >
              <Mail className="w-5 h-5" />
              Falar com Comercial
            </Button>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
