import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-maxima-ia-negativo.png";

export const Hero = () => {
  return (
    <div className="min-h-screen bg-gradient-hero p-8 space-y-6 antialiased">
      <header className="flex justify-between items-center max-w-6xl mx-auto">
        <img src={logo} alt="Máxima iA" className="h-16 md:h-20 lg:h-24 w-auto" />
        <Link to="/auth">
          <Button variant="outline" size="sm">
            Entrar
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto space-y-16 pt-16">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Defina a{" "}
            <span className="bg-gradient-text bg-clip-text text-transparent">
              Identidade
            </span>{" "}
            da sua Empresa em Minutos
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Crie Missão, Visão e Valores profissionais com inteligência artificial.
            Gratuito, rápido e alinhado com o propósito do seu negócio.
          </p>
          <Link to="/capturar">
            <Button size="lg" className="gap-2">
              Gerar meu MVV Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </section>

        {/* Benefits Section */}
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <h2 className="text-3xl font-bold text-center">
            Como <span className="bg-gradient-text bg-clip-text text-transparent">Funciona</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="space-y-3">
              <div className="text-4xl">📝</div>
              <h3 className="text-xl font-semibold text-white">1. Conte sobre sua empresa</h3>
              <p className="text-slate-300">
                Responda perguntas simples sobre seu negócio, público e propósito
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl">🤖</div>
              <h3 className="text-xl font-semibold text-white">2. IA gera seu MVV</h3>
              <p className="text-slate-300">
                Nossa inteligência artificial cria propostas personalizadas em segundos
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl">⬇️</div>
              <h3 className="text-xl font-semibold text-white">3. Exporte e use</h3>
              <p className="text-slate-300">
                Refine, salve e exporte seu documento para usar imediatamente
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-white">
            Teste Grátis - Crie Seu Primeiro MVV
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-200 text-lg">
                <span className="text-2xl">✨</span>
                <span>Um projeto MVV gratuito por e-mail</span>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-200 text-lg">
                <span className="text-2xl">🎨</span>
                <span>Refine e personalize seu MVV</span>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-200 text-lg">
                <span className="text-2xl">⚡</span>
                <span>Processo rápido (cerca de 10 min)</span>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-200 text-lg">
                <span className="text-2xl">📄</span>
                <span>Exporte em PDF, Markdown ou copie</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Pronto para Definir sua Identidade Corporativa?
          </h2>
          <Link to="/capturar">
            <Button size="lg" className="gap-2">
              Começar Agora - É Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="text-center text-slate-300 text-sm space-x-4 pb-8">
        <Link to="/termos" className="hover:text-white transition-colors">
          Termos de Uso
        </Link>
        <span>•</span>
        <Link to="/privacidade" className="hover:text-white transition-colors">
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
};