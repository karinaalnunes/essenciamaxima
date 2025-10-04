import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";

export default function Obrigado() {
  return (
    <div className="min-h-screen bg-gradient-hero p-8 flex items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <img src={logo} alt="Máxima iA" className="h-16 md:h-20 w-auto mx-auto" />

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
            <Link to="/auth">
              <Button size="lg" className="w-full">
                Criar Minha Conta e Começar
              </Button>
            </Link>
            
            <p className="text-sm text-slate-400">
              Já tem uma conta?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Faça login aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}