import { Button } from "./ui/button";
import { ArrowRight, Clock, Sparkles, Target, Users, Heart, Shield, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import logo from "@/assets/logo-maxima-ia-negativo.png";

export const Hero = () => {
  return (
    <div className="min-h-screen bg-gradient-hero antialiased">
      {/* Header */}
      <header className="flex justify-between items-center max-w-6xl mx-auto px-8 pt-8">
        <img src={logo} alt="Máxima iA" className="h-16 md:h-20 lg:h-24 w-auto" />
        <Link to="/auth">
          <Button variant="outline" size="sm">
            Entrar
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-8">
        {/* Section 1: Hero */}
        <section className="text-center space-y-8 pt-16 pb-32">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            Teste gratuito - Poucos minutos
          </Badge>
          
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
            <Button size="lg" className="gap-2 text-lg px-8 py-6">
              Gerar meu MVV Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </section>

        {/* Section 2: Social Proof - Gallup Data */}
        <section className="py-32 border-t border-slate-800">
          <div className="bg-card/50 border border-slate-700/50 rounded-3xl p-12 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <TrendingUp className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Por que <span className="bg-gradient-text bg-clip-text text-transparent">Missão, Visão e Valores</span> importam?
              </h2>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Dados da Gallup mostram que empresas com propósito claro têm:
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-text bg-clip-text text-transparent">
                    2.3x
                  </div>
                  <p className="text-slate-200 text-lg">
                    Mais engajamento dos colaboradores
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-text bg-clip-text text-transparent">
                    59%
                  </div>
                  <p className="text-slate-200 text-lg">
                    Menos rotatividade de talentos
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="text-5xl font-bold bg-gradient-text bg-clip-text text-transparent">
                    21%
                  </div>
                  <p className="text-slate-200 text-lg">
                    Maior lucratividade média
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Como Funciona */}
        <section className="py-32 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Como <span className="bg-gradient-text bg-clip-text text-transparent">Funciona</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-4 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">1. Conte sobre sua empresa</h3>
              <p className="text-slate-300 leading-relaxed">
                Responda perguntas simples sobre seu negócio, público e propósito em um diálogo consultivo
              </p>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-4 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">2. IA gera seu MVV</h3>
              <p className="text-slate-300 leading-relaxed">
                Nossa inteligência artificial cria propostas personalizadas em segundos
              </p>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm space-y-4 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
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
        <section className="py-32 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Teste Grátis - Crie Seu Primeiro MVV
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-slate-200 text-lg">Um projeto MVV gratuito por e-mail</span>
              </div>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <Target className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-slate-200 text-lg">Refine e personalize seu MVV</span>
              </div>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-slate-200 text-lg">Processo rápido (cerca de 10 min)</span>
              </div>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-slate-200 text-lg">Exporte em PDF, Markdown ou copie</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Social Proof - Testimonials */}
        <section className="py-32 border-t border-slate-800">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-3 bg-card/30 border border-slate-700/50 rounded-full px-6 py-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-slate-200 font-semibold">+150 empresários impactados</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Junte-se a <span className="bg-gradient-text bg-clip-text text-transparent">Centenas de Empresários</span>
            </h2>
            
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              que já definiram a identidade de suas empresas e estão construindo culturas mais fortes e alinhadas
            </p>
          </div>
        </section>

        {/* Section 6: Process Walkthrough - 7 Etapas */}
        <section className="py-32 border-t border-slate-800">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            7 Etapas para seu <span className="bg-gradient-text bg-clip-text text-transparent">MVV Perfeito</span>
          </h2>
          
          <p className="text-slate-300 text-lg text-center mb-16 max-w-2xl mx-auto">
            Um processo consultivo guiado por IA que leva você do contexto à clareza estratégica
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Placeholder for screenshots */}
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-8 space-y-4">
              <div className="aspect-video bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                <BarChart3 className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold">Chat Consultivo em Ação</h3>
              <p className="text-slate-400 text-sm">
                Perguntas inteligentes que extraem o máximo do seu contexto empresarial
              </p>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-8 space-y-4">
              <div className="aspect-video bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                <Target className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold">MVV Gerado pela IA</h3>
              <p className="text-slate-400 text-sm">
                Propostas personalizadas de Missão, Visão e Valores alinhadas ao seu negócio
              </p>
            </div>
            
            <div className="bg-card/30 border border-slate-700/50 rounded-3xl p-8 space-y-4">
              <div className="aspect-video bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                <CheckCircle2 className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold">Relatório Final em PDF</h3>
              <p className="text-slate-400 text-sm">
                Documento profissional pronto para ser compartilhado com seu time
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Bridge to Essência Máxima */}
        <section className="py-32 border-t border-slate-800">
          <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/30 rounded-3xl p-12 backdrop-blur-sm">
            <div className="text-center space-y-6 mb-12">
              <Badge variant="secondary" className="mb-4">
                Próximo Passo Exclusivo
              </Badge>
              
              <h2 className="text-3xl md:text-4xl font-bold">
                Após o MVV, conheça a <span className="bg-gradient-text bg-clip-text text-transparent">Essência Máxima</span>
              </h2>
              
              <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
                Transforme seus Valores em <strong>Rituais Práticos</strong>, defina <strong>Princípios Norteadores</strong> 
                e crie um <strong>Plano de Ação SMART</strong> — o DNA da sua empresa em ação
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-card/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
                <Shield className="w-8 h-8 text-primary" />
                <h3 className="font-semibold">Princípios Norteadores</h3>
                <p className="text-slate-400 text-sm">Guias práticos de decisão do dia a dia</p>
              </div>
              
              <div className="bg-card/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
                <Users className="w-8 h-8 text-primary" />
                <h3 className="font-semibold">Rituais Culturais</h3>
                <p className="text-slate-400 text-sm">Práticas que enraízam seus valores</p>
              </div>
              
              <div className="bg-card/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
                <Target className="w-8 h-8 text-primary" />
                <h3 className="font-semibold">Plano de Ação SMART</h3>
                <p className="text-slate-400 text-sm">Metas claras e mensuráveis</p>
              </div>
              
              <div className="bg-card/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
                <Heart className="w-8 h-8 text-primary" />
                <h3 className="font-semibold">Desenvolvimento Integral</h3>
                <p className="text-slate-400 text-sm">Crescimento humano e profissional</p>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-card/80 border border-slate-700/50 rounded-2xl p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Código Completo</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">R$ 197</span>
                    <span className="text-slate-400">pagamento único</span>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Robô consultivo completo (7 etapas)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Relatório Essência Máxima em PDF</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Plano de Ação SMART</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Acesso vitalício ao material</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 border-2 border-primary rounded-2xl p-8 space-y-6 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  MAIS ESCOLHIDA
                </Badge>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">Código + Mentoria Individual</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold">R$ 697</span>
                    <span className="text-slate-400 line-through">R$ 1.697</span>
                  </div>
                  <p className="text-sm text-primary font-semibold">Economize R$ 1.000</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Tudo da Opção 1</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300"><strong>1 sessão individual de 1h</strong> comigo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Revisão personalizada do seu Código</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">Suporte na implementação inicial</span>
                  </li>
                </ul>
                
                <p className="text-xs text-slate-400 pt-4 border-t border-slate-700">
                  💰 Valor real da sessão: R$ 1.500
                </p>
              </div>
            </div>
            
            <p className="text-center text-slate-400 text-sm mt-8">
              Disponível apenas para quem completar o MVV gratuito
            </p>
          </div>
        </section>

        {/* Section 8: Final CTA */}
        <section className="text-center space-y-8 py-32">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para Definir sua Identidade Corporativa?
          </h2>
          
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Comece agora com seu MVV gratuito e descubra o poder de uma cultura bem definida
          </p>
          
          <Link to="/capturar">
            <Button size="lg" className="gap-2 text-lg px-8 py-6">
              Começar Agora - É Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
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