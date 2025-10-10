import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Heart, ArrowRight, Shield, CheckCircle, Users, Repeat, BarChart3, Target } from "lucide-react";

const DIMENSIONS = [
  { 
    icon: Shield, 
    title: "Princípios Norteadores",
    description: "Regras de ouro para decisões difíceis"
  },
  { 
    icon: Users, 
    title: "Rituais Culturais",
    description: "Transforme valores em práticas diárias"
  },
  { 
    icon: Repeat, 
    title: "Ciclo de Feedback",
    description: "Sistema contínuo de reconhecimento"
  },
  { 
    icon: Heart, 
    title: "Desenvolvimento Integral",
    description: "Crescimento técnico + emocional"
  },
  { 
    icon: CheckCircle, 
    title: "Padrões de Excelência",
    description: "Comportamentos esperados no dia a dia"
  },
  { 
    icon: BarChart3, 
    title: "Indicadores de Cultura",
    description: "Métricas para medir a evolução"
  },
  { 
    icon: Target, 
    title: "Plano de Ação SMART",
    description: "Do papel para realidade em 30 dias"
  },
];

export function UpsellEssenciaMaxima() {
  return (
    <Card className="bg-gradient-to-br from-purple-950/40 via-slate-900/40 to-blue-950/40 border-purple-500/30 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            🎯 Próximo Passo
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-slate-400" />
            <span className="text-slate-400 text-sm line-through">MVV no papel</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-purple-400" />
            <CardTitle className="text-2xl text-white">
              Sistema de Cultura Completo
            </CardTitle>
          </div>
        </div>
        
        <p className="text-slate-300 text-lg mt-4">
          Você tem <strong className="text-white">clareza sobre ONDE quer chegar</strong>.
          <br />
          <span className="text-purple-300">
            Mas como garantir que isso saia do papel e transforme sua empresa?
          </span>
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Hook do Problema */}
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-slate-300">
            <strong className="text-yellow-300">80% dos MVVs</strong> ficam na gaveta porque faltam os elementos críticos 
            para transformá-los em <strong className="text-white">cultura viva</strong>.
          </p>
        </div>

        {/* As 7 Dimensões */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">Essência Máxima:</span> 7 Dimensões Estratégicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIMENSIONS.map((dimension, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <dimension.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm mb-1">
                    {dimension.title}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    {dimension.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transformação */}
        <div className="p-4 bg-gradient-to-r from-blue-950/30 to-purple-950/30 rounded-lg border border-blue-500/30">
          <p className="text-slate-200 text-center">
            <strong className="text-blue-300">De:</strong> MVV que ninguém lembra
            <br />
            <strong className="text-purple-300">Para:</strong> Sistema que guia cada decisão da empresa
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            size="lg" 
            className="flex-1 gap-2"
            onClick={() => window.open('https://wa.me/5511999999999?text=Quero%20conhecer%20a%20Ess%C3%AAncia%20M%C3%A1xima', '_blank')}
          >
            <Heart className="w-5 h-5" />
            Ver Essência Máxima
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-slate-400 text-xs text-center">
          💡 Programa de consultoria guiada em 7 etapas + Plano de Ação em 30 dias
        </p>
      </CardContent>
    </Card>
  );
}
