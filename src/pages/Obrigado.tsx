import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { useConfetti } from "@/hooks/useConfetti";
import { supabase } from "@/integrations/supabase/client";

export default function Obrigado() {
  const { fireConfetti } = useConfetti();
  const navigate = useNavigate();

  useEffect(() => {
    // Dispara confetes após breve delay para usuário ver a página
    const timer = setTimeout(() => {
      fireConfetti('normal');
    }, 300);

    return () => clearTimeout(timer);
  }, [fireConfetti]);

  return (
    <div className="min-h-screen bg-gradient-hero p-8 flex items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <img src={logo} alt="Máxima iA" width="150" height="75" className="mx-auto" />

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-12 backdrop-blur-sm space-y-6">
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
          
          <h1 className="text-4xl font-bold text-white">
            Cadastro Realizado com <span className="bg-gradient-text bg-clip-text text-transparent">Sucesso!</span>
          </h1>
          
          <p className="text-slate-300 text-lg leading-relaxed">
            Enviamos um e-mail de boas-vindas para você. Agora é só criar sua conta e começar a 
            gerar seu MVV profissional gratuitamente!
          </p>

          <div className="pt-4 space-y-4">
            <Button 
              size="lg" 
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut({ scope: "global" });
                navigate("/auth?tab=signup");
              }}
            >
              Criar Minha Conta e Começar
            </Button>
            
            <p className="text-sm text-slate-400">
              Já tem uma conta?{" "}
              <Link to="/auth?tab=login" className="text-primary hover:underline">
                Faça login aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}