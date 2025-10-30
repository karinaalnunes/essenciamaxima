import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Loader2, Heart } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { useToast } from "@/hooks/use-toast";

const CULTURA_FEATURES = [
  "Diagnóstico completo com Anamnese Máxima",
  "Código de Cultura personalizado para sua empresa",
  "7 dimensões estratégicas de cultura organizacional",
  "Plano de ação 30/60/90/120 dias",
  "Indicadores de cultura e rituais práticos",
  "Consultoria guiada por IA especializada",
];

export default function CheckoutCultura() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mvvDocument, setMvvDocument] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Verificar se tem MVV completo
      const { data: docs } = await supabase
        .from("mvv_documents")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!docs || docs.length === 0 || !docs[0].mission || !docs[0].vision) {
        toast({
          title: "MVV incompleto",
          description: "Complete seu MVV antes de adquirir o Cultura Máxima",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setMvvDocument(docs[0]);

      // Verificar se já comprou
      const { data: purchases } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("product_type", "cultura_maxima")
        .in("status", ["completed", "succeeded"])
        .limit(1);

      if (purchases && purchases.length > 0) {
        setHasPurchased(true);
        toast({
          title: "Produto já adquirido",
          description: "Redirecionando para a Anamnese...",
        });
        setTimeout(() => navigate("/anamnese-cultura"), 1500);
        return;
      }

      setLoading(false);
    };

    checkAuthAndStatus();
  }, [navigate, toast]);

  const handleCheckout = async () => {
    setProcessing(true);
    
    try {
      // Registrar intenção de compra
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          product_type: "cultura_maxima",
          amount: 997.00,
          currency: "BRL",
          status: "pending",
          metadata: {
            mvv_document_id: mvvDocument.id,
            company_name: mvvDocument.company_name,
          }
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Simular pagamento bem-sucedido para MVP
      // TODO: Integrar com Stripe real posteriormente
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar status do pagamento
      const { error: updateError } = await supabase
        .from("purchases")
        .update({ status: "completed" })
        .eq("id", purchase.id);

      if (updateError) throw updateError;

      toast({
        title: "✅ Pagamento confirmado!",
        description: "Redirecionando para a Anamnese Máxima...",
      });

      setTimeout(() => navigate("/anamnese-cultura"), 1500);
      
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast({
        title: "Erro no pagamento",
        description: "Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-8">
      <header className="max-w-6xl mx-auto flex items-center gap-4 mb-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <img src={logo} alt="Máxima iA" className="h-16 md:h-20 w-auto" />
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Heart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Cultura Máxima
          </h1>
          <p className="text-xl text-slate-300">
            Transforme seu MVV em uma cultura viva e mensurável
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card do Produto */}
          <Card className="bg-slate-800/50 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Código de Cultura Completo
              </CardTitle>
              <CardDescription className="text-slate-300">
                Sistema completo para implementar e medir cultura organizacional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {CULTURA_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-600">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-white">R$ 997</span>
                  <span className="text-slate-400">pagamento único</span>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  disabled={processing || hasPurchased}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : hasPurchased ? (
                    "Já Adquirido"
                  ) : (
                    "Adquirir Agora"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Informações */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Como funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-2">
                  1️⃣ Anamnese Máxima
                </h3>
                <p className="text-sm">
                  Diagnóstico profundo da realidade atual da sua empresa em 6 dimensões estratégicas
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  2️⃣ Consultoria Guiada
                </h3>
                <p className="text-sm">
                  Nossa IA consultora te guia na criação do Código de Cultura, baseado no seu MVV e contexto real
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  3️⃣ Plano de Ação
                </h3>
                <p className="text-sm">
                  Receba um roadmap completo 30/60/90/120 dias para implementar a cultura na prática
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  4️⃣ Indicadores e Rituais
                </h3>
                <p className="text-sm">
                  Métricas claras e práticas culturais para manter a cultura viva no dia a dia
                </p>
              </div>

              <div className="pt-4 border-t border-slate-600">
                <p className="text-sm text-slate-400">
                  💡 <strong className="text-white">Baseado no método Máxima IA:</strong> Sistema de consultoria organizacional validado com dezenas de empresas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Dúvidas? Entre em contato via WhatsApp: (XX) XXXXX-XXXX
          </p>
        </div>
      </main>
    </div>
  );
}
