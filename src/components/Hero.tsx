import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Clock,
  Sparkles,
  Target,
  Users,
  Heart,
  Shield,
  CheckCircle2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listener para mudanças em tempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero antialiased starfield-bg">
      {/* Header */}
      <header className="flex justify-between items-center max-w-6xl mx-auto px-8 pt-8">
        <img src={logo} alt="Máxima iA" width="150" height="75" />
        {isAuthenticated ? (
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              Ir para o Dashboard
            </Button>
          </Link>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-8">
        {/* Section 1: Hero */}
        <section className="text-center space-y-10 pt-16 pb-20 py-0">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-2 animate-fade-in-scale">
            <Clock className="w-4 h-4 mr-2" />
            Teste gratuito - Poucos minutos
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in-up">
            Defina a <span className="bg-gradient-text bg-clip-text text-transparent">Identidade</span> da sua Empresa
            em Minutos
          </h1>

          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-100">
            Crie Missão, Visão e Valores profissionais com inteligência artificial. Gratuito, rápido e alinhado com o
            propósito do seu negócio.
          </p>

          <Link to="/capturar">
            <Button
              size="lg"
              className="gap-2 text-lg px-8 group animate-fade-in-up animation-delay-200 py-[24px] my-[25px]"
            >
              Gerar meu MVV Grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </section>

        {/* Section 2: Social Proof - Gallup Data */}
        <section className="py-24 border-t border-slate-800">
          <div className="bg-card/50 border border-slate-700/50 rounded-3xl p-12 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <TrendingUp className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Por que <span className="bg-gradient-text bg-clip-text text-transparent">Missão, Visão e Valores</span>{" "}
                importam?
              </h2>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Dados da Gallup mostram que empresas com propósito claro têm:
              </p>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-text bg-clip-text text-transparent">2.3x</div>
                  <p className="text-slate-200 text-lg">Mais engajamento dos colaboradores</p>
                </div>
                <div className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-text bg-clip-text text-transparent">59%</div>
                  <p className="text-slate-200 text-lg">Menos rotatividade de talentos</p>
                </div>
                <div className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-text bg-clip-text text-transparent">21%</div>
                  <p className="text-slate-200 text-lg">Maior lucratividade média</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Como Funciona */}
        <section className="py-20 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 animate-fade-in-up">
            Como <span className="bg-gradient-text bg-clip-text text-transparent">Funciona</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-card/40 border border-slate-700/60 rounded-3xl p-8 backdrop-blur-sm space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-100">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">1. Conte sobre sua empresa</h3>
              <p className="text-slate-300 leading-relaxed">
                Responda perguntas simples sobre seu negócio, público e propósito em um diálogo consultivo
              </p>
            </div>

            <div className="group relative bg-card/40 border border-slate-700/60 rounded-3xl p-8 backdrop-blur-sm space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-200">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">2. IA gera seu MVV</h3>
              <p className="text-slate-300 leading-relaxed">
                Nossa inteligência artificial cria propostas personalizadas em segundos
              </p>
            </div>

            <div className="group relative bg-card/40 border border-slate-700/60 rounded-3xl p-8 backdrop-blur-sm space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">3. Exporte e use</h3>
              <p className="text-slate-300 leading-relaxed">
                Refine, salve e exporte seu documento para usar imediatamente
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Features Grid */}
        <section className="py-16 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 animate-fade-in-up">
            Teste Grátis - Crie Seu Primeiro MVV
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-sm hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 text-lg">Um projeto MVV gratuito por e-mail</span>
              </div>
            </div>

            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-sm hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <Target className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 text-lg">Refine e personalize seu MVV</span>
              </div>
            </div>

            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-sm hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 text-lg">Processo rápido (cerca de 10 min)</span>
              </div>
            </div>

            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-sm hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 text-lg">Exporte em PDF, Markdown ou copie</span>
              </div>
            </div>

            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-sm hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 text-lg">100% seguro e confidencial</span>
              </div>
            </div>

            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-sm hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <Heart className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 text-lg">Alinhado ao seu propósito</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Social Proof - Testimonials */}
        <section className="border-t border-slate-800 py-[8px]">
          <div className="text-center space-y-12 py-[50px]">
            <h2 className="text-3xl md:text-4xl font-bold animate-fade-in-up">
              Junte-se a <span className="bg-gradient-text bg-clip-text text-transparent">Diversos de Empresários</span>
            </h2>

            {/* NOVO: Grid de conquistas */}
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
              <div className="group bg-card/40 border border-slate-700/60 rounded-2xl p-6 space-y-2 hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-scale animation-delay-100">
                <div className="text-4xl font-bold text-primary group-hover:scale-110 transition-transform">10min</div>
                <p className="text-slate-300 text-sm">Tempo médio para completar</p>
              </div>
              <div className="group bg-card/40 border border-slate-700/60 rounded-2xl p-6 space-y-2 hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-scale animation-delay-200">
                <div className="text-4xl font-bold text-primary group-hover:scale-110 transition-transform">100%</div>
                <p className="text-slate-300 text-sm">Personalizado para seu negócio</p>
              </div>
              <div className="group bg-card/40 border border-slate-700/60 rounded-2xl p-6 space-y-2 hover:bg-card/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-scale animation-delay-300">
                <div className="text-4xl font-bold text-primary group-hover:scale-110 transition-transform">Grátis</div>
                <p className="text-slate-300 text-sm">Sem cartão de crédito</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Process Walkthrough - 7 Etapas */}
        <section className="py-24 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 animate-fade-in-up">
            Veja como funciona na <span className="bg-gradient-text bg-clip-text text-transparent">prática</span>
          </h2>

          <p className="text-slate-300 text-lg text-center mb-16 max-w-2xl mx-auto">
            Um processo consultivo guiado por IA que leva você do contexto à clareza estratégica
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: Chat Consultivo */}
            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-8 space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-100">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl flex flex-col items-center justify-center border border-slate-700/30 p-6 group-hover:scale-[1.02] transition-transform">
                <BarChart3 className="w-16 h-16 text-primary mb-4" />
                <div className="text-center space-y-2">
                  <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg px-4 py-2">
                    "Qual é o principal objetivo do seu negócio?"
                  </div>
                  <div className="text-sm text-slate-300 bg-primary/20 rounded-lg px-4 py-2">
                    "Transformar vidas através da educação..."
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold">1. Chat Consultivo Inteligente</h3>
              <p className="text-slate-400 text-sm">
                Perguntas estratégicas que extraem o máximo do seu contexto empresarial
              </p>
            </div>

            {/* Card 2: MVV sendo gerado */}
            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-8 space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-200">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl flex flex-col items-center justify-center border border-slate-700/30 p-6 group-hover:scale-[1.02] transition-transform">
                <Target className="w-16 h-16 text-primary mb-4 animate-pulse" />
                <div className="space-y-2 w-full">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-blue-500 w-3/4 animate-gradient-shift"></div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Analisando contexto...</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold">2. IA Gera Propostas</h3>
              <p className="text-slate-400 text-sm">
                Algoritmo cria Missão, Visão e Valores personalizados para seu negócio
              </p>
            </div>

            {/* Card 3: Resultado Final */}
            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-8 space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-300">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl flex flex-col items-center justify-center border border-slate-700/30 p-6 group-hover:scale-[1.02] transition-transform">
                <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
                <div className="text-center space-y-1 w-full px-4">
                  <div className="text-xs font-semibold text-primary">MISSÃO</div>
                  <div className="text-[10px] text-slate-300 leading-relaxed">Transformar realidades através...</div>
                  <div className="h-px bg-slate-700 my-2"></div>
                  <div className="text-xs font-semibold text-primary">VISÃO</div>
                  <div className="text-[10px] text-slate-300 leading-relaxed">Ser referência nacional em...</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold">3. Refine Seu MVV</h3>
              <p className="text-slate-400 text-sm">Ajuste cada elemento até ficar perfeito para sua empresa</p>
            </div>

            {/* Card 4: Export em PDF */}
            <div className="group bg-card/40 border border-slate-700/60 rounded-3xl p-8 space-y-4 hover:bg-card/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in-scale animation-delay-400">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl flex flex-col items-center justify-center border border-slate-700/30 p-6 group-hover:scale-[1.02] transition-transform">
                <div className="bg-white/10 rounded-lg p-4 border border-slate-600">
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-600 rounded w-20"></div>
                    <div className="h-2 bg-slate-600 rounded w-16"></div>
                    <div className="h-px bg-slate-600 my-2"></div>
                    <div className="h-1.5 bg-slate-700 rounded w-24"></div>
                    <div className="h-1.5 bg-slate-700 rounded w-20"></div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">documento_mvv.pdf</p>
              </div>
              <h3 className="text-lg font-semibold">4. Exporte e Compartilhe</h3>
              <p className="text-slate-400 text-sm">Documento profissional em PDF pronto para apresentar ao seu time</p>
            </div>
          </div>
        </section>

        {/* Section 7: Final CTA */}
        <section className="text-center space-y-8 py-20 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold animate-fade-in-up">
            Pronto para Definir sua Identidade Corporativa?
          </h2>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
            Comece agora com seu MVV gratuito e descubra o poder de uma cultura bem definida
          </p>

          <Link to="/capturar">
            <Button size="lg" className="gap-2 text-lg px-8 py-6 group animate-fade-in-up animation-delay-200">
              Começar Agora - É Grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* NOVO: Micro-hint sutil */}
          <p className="text-slate-400 text-sm mt-8 max-w-xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
            💡{" "}
            <em>Após concluir seu MVV, você descobrirá como transformar isso em prática no dia a dia da sua empresa</em>
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-8 text-center text-slate-400 text-sm space-x-4">
          <Link to="/termos" className="hover:text-foreground transition-colors">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link to="/privacidade" className="hover:text-foreground transition-colors">
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
};
