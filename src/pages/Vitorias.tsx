import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Trophy, Lock, CheckCircle, Loader2 } from "lucide-react";
import { MODULE_GAINS, getModuleStatus, type ModuleGainConfig } from "@/config/moduleGains";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
export default function Vitorias() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mvvStatus, setMvvStatus] = useState<string>('none');
  const [cultureStatus, setCultureStatus] = useState<string>('none');
  const [valueChainStatus, setValueChainStatus] = useState<string>('none');
  const [processStatus, setProcessStatus] = useState<string>('none');
  const [mvvCompletedAt, setMvvCompletedAt] = useState<Date | null>(null);
  const [cultureCompletedAt, setCultureCompletedAt] = useState<Date | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch MVV status
      const {
        data: mvvDocs
      } = await supabase.from("mvv_documents").select("*").eq("user_id", session.user.id).order("created_at", {
        ascending: false
      });
      if (mvvDocs && mvvDocs.length > 0) {
        const hasAllFields = mvvDocs[0].mission && mvvDocs[0].vision && mvvDocs[0].values;
        setMvvStatus(hasAllFields ? 'complete' : 'incomplete');
        if (hasAllFields) {
          setMvvCompletedAt(new Date(mvvDocs[0].updated_at));
        }
      }

      // Fetch Culture status
      const {
        data: cultureDocs
      } = await supabase.from("culture_documents").select("*").eq("user_id", session.user.id).order("created_at", {
        ascending: false
      });
      if (cultureDocs && cultureDocs.length > 0) {
        const isComplete = cultureDocs[0].action_plan_30 && cultureDocs[0].action_plan_60 && cultureDocs[0].action_plan_90 && cultureDocs[0].action_plan_120;
        setCultureStatus(isComplete ? 'complete' : 'incomplete');
        if (isComplete) {
          setCultureCompletedAt(new Date(cultureDocs[0].updated_at));
        }
      }

      // Fetch Value Chain status
      const {
        data: valueChainDocs
      } = await supabase.from("value_chain_documents").select("*").eq("user_id", session.user.id).order("created_at", {
        ascending: false
      });
      if (valueChainDocs && valueChainDocs.length > 0) {
        setValueChainStatus(valueChainDocs[0].status === 'complete' ? 'complete' : 'incomplete');
      }

      // Process status (placeholder - ajustar quando implementar)
      setProcessStatus('none');
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);
  const renderModuleAccordion = (module: ModuleGainConfig, status: 'complete' | 'in-progress' | 'locked', completedAt?: Date | null) => {
    const isComplete = status === 'complete';
    const isLocked = status === 'locked';
    return <AccordionItem value={module.id} className={cn("border rounded-lg mb-4 overflow-hidden", isComplete && "border-emerald-500/50 bg-emerald-500/5", isLocked && "border-slate-600/30 bg-slate-800/20 opacity-60")}>
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex items-center gap-4 w-full">
            <span className="text-3xl">{module.emoji}</span>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-foreground">{module.name}</h3>
              {isComplete && completedAt && <p className="text-sm text-emerald-400">
                  Concluído em {format(completedAt, "dd/MM/yyyy", {
                locale: ptBR
              })}
                </p>}
              {isLocked && <p className="text-sm text-slate-500">Complete os módulos anteriores para desbloquear</p>}
            </div>
            {isComplete && <CheckCircle className="w-6 h-6 text-emerald-400" />}
            {isLocked && <Lock className="w-6 h-6 text-slate-500" />}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 mt-2">
            {isComplete ? <>
                <p className="text-sm text-muted-foreground mb-4">
                  🎉 Parabéns! Você conquistou todos esses ganhos:
                </p>
                {module.gains.map((gain, index) => <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <Trophy className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">{gain.title}</h4>
                      <p className="text-sm text-muted-foreground">{gain.description}</p>
                    </div>
                  </div>)}
                {module.reportRoute && <Button onClick={() => navigate(module.reportRoute!)} className="w-full mt-4" variant="outline">
                    Ver Relatório Completo
                  </Button>}
              </> : <>
                <p className="text-sm text-muted-foreground mb-4">
                  ✨ Futuros Ganhos - O que você conquistará ao completar este módulo:
                </p>
                {module.gains.map((gain, index) => <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-400">{gain.title}</h4>
                      <p className="text-sm text-slate-500">{gain.description}</p>
                    </div>
                  </div>)}
              </>}
          </div>
        </AccordionContent>
      </AccordionItem>;
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  const modules = [{
    config: MODULE_GAINS.mvv,
    status: getModuleStatus('mvv', mvvStatus, cultureStatus, valueChainStatus, processStatus),
    completedAt: mvvCompletedAt
  }, {
    config: MODULE_GAINS.cultura,
    status: getModuleStatus('cultura', mvvStatus, cultureStatus, valueChainStatus, processStatus),
    completedAt: cultureCompletedAt
  }, {
    config: MODULE_GAINS.valorChain,
    status: getModuleStatus('valorChain', mvvStatus, cultureStatus, valueChainStatus, processStatus),
    completedAt: null
  }, {
    config: MODULE_GAINS.processos,
    status: getModuleStatus('processos', mvvStatus, cultureStatus, valueChainStatus, processStatus),
    completedAt: null
  }];
  const totalGains = modules.reduce((acc, m) => acc + (m.status === 'complete' ? m.config.gains.length : 0), 0);
  const completedModules = modules.filter(m => m.status === 'complete').length;
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🏆 Suas Vitórias
              </h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {totalGains} Ganhos Conquistados
              </h2>
              <p className="text-muted-foreground">
                {completedModules} de {modules.length} módulos completos
              </p>
            </div>
            <Trophy className="w-16 h-16 text-primary" />
          </div>
          <div className="mt-4 bg-slate-700/30 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500" style={{
            width: `${completedModules / modules.length * 100}%`
          }} />
          </div>
        </Card>

        {/* Modules Accordion */}
        <Accordion type="single" collapsible className="space-y-0">
          {modules.map(module => renderModuleAccordion(module.config, module.status, module.completedAt))}
        </Accordion>

        {/* Motivational Message */}
        {completedModules < modules.length && <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 p-6 mt-8">
            <h3 className="text-xl font-bold text-foreground mb-2">
              🚀 Continue sua jornada!
            </h3>
            <p className="text-muted-foreground">
              Cada módulo concluído te aproxima de uma transformação completa do seu negócio. 
              Continue avançando e desbloqueie todos os ganhos estratégicos!
            </p>
          </Card>}
      </main>
    </div>;
}
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}