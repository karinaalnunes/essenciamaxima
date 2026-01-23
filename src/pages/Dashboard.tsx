import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { PILLARS, getPillarsArray, isPillarUnlocked, getPillarProgress } from "@/config/pillars";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fireConfetti } = useConfetti();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [essenciaComplete, setEssenciaComplete] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [nextActions, setNextActions] = useState<{ title: string; route: string; pillar: string }[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Load completed modules
      const completed: string[] = [];
      let company = "";

      // Check MVV
      const { data: mvvDocs } = await supabase
        .from("mvv_documents")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (mvvDocs && mvvDocs[0]) {
        company = mvvDocs[0].company_name || "";
        if (mvvDocs[0].mission && mvvDocs[0].vision && mvvDocs[0].values) {
          completed.push("mvv");
        }
      }

      // Check Anamnese
      const { data: anamnesisDocs } = await supabase
        .from("organizational_anamnesis")
        .select("completed_at")
        .eq("user_id", session.user.id)
        .not("completed_at", "is", null)
        .limit(1);

      if (anamnesisDocs && anamnesisDocs.length > 0) {
        completed.push("anamnese");
      }

      // Check Culture
      const { data: cultureDocs } = await supabase
        .from("culture_documents")
        .select("cultural_essence, guiding_principles")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cultureDocs && cultureDocs[0]?.cultural_essence) {
        completed.push("cultura");
      }

      // Check Value Chain
      const { data: valueChainDocs } = await supabase
        .from("value_chain_documents")
        .select("status")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (valueChainDocs && valueChainDocs[0]?.status === "completed") {
        completed.push("valorChain");
      }

      // Check Process
      const { data: processDocs } = await supabase
        .from("process_documents")
        .select("status")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (processDocs && processDocs[0]?.status === "completed") {
        completed.push("processos");
      }

      setCompletedModules(completed);
      setCompanyName(company);

      // Essência is complete if MVV and Cultura are done
      const essenciaIsDone = completed.includes("mvv") && completed.includes("cultura");
      setEssenciaComplete(essenciaIsDone);

      // Build next actions
      const actions: { title: string; route: string; pillar: string }[] = [];
      
      if (!completed.includes("mvv")) {
        actions.push({ title: "Iniciar Essência Máxima (MVV)", route: "/essencia/mvv", pillar: "essencia" });
      } else if (!completed.includes("anamnese")) {
        actions.push({ title: "Completar Anamnese Organizacional", route: "/essencia/anamnese", pillar: "essencia" });
      } else if (!completed.includes("cultura")) {
        actions.push({ title: "Criar Código de Cultura", route: "/essencia/cultura", pillar: "essencia" });
      }
      
      if (essenciaIsDone && !completed.includes("valorChain")) {
        actions.push({ title: "Mapear Cadeia de Valor", route: "/estrutura/cadeia-valor", pillar: "estrutura" });
      }
      if (essenciaIsDone && !completed.includes("processos")) {
        actions.push({ title: "Documentar Processos", route: "/estrutura/processos", pillar: "estrutura" });
      }

      setNextActions(actions.slice(0, 3));

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Confetti when unlocking new pillars
  useEffect(() => {
    const justCompletedCulture = sessionStorage.getItem("just_completed_culture");
    if (justCompletedCulture === "true" && completedModules.includes("cultura")) {
      sessionStorage.removeItem("just_completed_culture");
      fireConfetti("intense");
      toast({
        title: "Novos pilares desbloqueados",
        description: "Estrutura, Governança e Conselho agora estão disponíveis.",
      });
    }
  }, [completedModules, fireConfetti, toast]);

  const pillars = getPillarsArray();

  const getPillarStatus = (pillarId: string) => {
    const progress = getPillarProgress(pillarId, completedModules);
    if (progress.percentage === 100) return "complete";
    if (progress.completed > 0) return "in-progress";
    return "not-started";
  };

  const getPillarCTA = (pillarId: string) => {
    const pillar = PILLARS[pillarId];
    const progress = getPillarProgress(pillarId, completedModules);
    
    if (progress.percentage === 100) {
      return { label: "Ver Conquistas", action: () => navigate("/vitorias") };
    }
    
    // Find next incomplete module
    const nextModule = pillar.modules.find(m => 
      m.isAvailable && !completedModules.includes(m.id)
    );
    
    if (nextModule) {
      return { 
        label: progress.completed > 0 ? "Continuar" : "Iniciar", 
        action: () => navigate(nextModule.route) 
      };
    }
    
    return { label: "Em breve", action: () => {} };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const totalModules = pillars.reduce((acc, p) => acc + p.modules.filter(m => m.isAvailable).length, 0);
  const completedCount = completedModules.length;
  const inProgressCount = pillars.filter(p => getPillarStatus(p.id) === "in-progress").length;
  const unlockedCount = pillars.filter(p => isPillarUnlocked(p.id, essenciaComplete)).length;

  return (
    <div className="p-6 lg:p-8 space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {companyName ? `Olá, ${companyName}` : "Bem-vindo"}
        </h1>
        <p className="text-muted-foreground">
          Sua jornada de transformação organizacional
        </p>
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pillars.map((pillar) => {
          const isUnlocked = isPillarUnlocked(pillar.id, essenciaComplete);
          const progress = getPillarProgress(pillar.id, completedModules);
          const status = getPillarStatus(pillar.id);
          const cta = getPillarCTA(pillar.id);
          const PillarIcon = pillar.icon;

          return (
            <Card 
              key={pillar.id}
              className={cn(
                "relative transition-all duration-200 border-border/50",
                isUnlocked 
                  ? "hover:border-primary/30 hover:shadow-sm cursor-pointer" 
                  : "opacity-50"
              )}
              onClick={() => isUnlocked && cta.action()}
            >
              {/* Hybrid badge */}
              {pillar.isHybrid && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Híbrido
                  </span>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <PillarIcon className="w-5 h-5 text-primary/70 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      {pillar.name}
                      {!isUnlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                      {status === "complete" && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                      {status === "in-progress" && (
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{pillar.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                {isUnlocked && progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{progress.completed}/{progress.total}</span>
                    </div>
                    <Progress 
                      value={progress.percentage} 
                      className="h-1"
                    />
                  </div>
                )}

                {/* Module list preview */}
                {isUnlocked && (
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.modules.slice(0, 4).map((module) => {
                      const isCompleted = completedModules.includes(module.id);
                      return (
                        <span 
                          key={module.id}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-md",
                            isCompleted 
                              ? "bg-success/20 text-success-foreground" 
                              : module.isAvailable 
                                ? "bg-secondary text-foreground/80"
                                : "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {isCompleted && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {module.name}
                        </span>
                      );
                    })}
                    {pillar.modules.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                        +{pillar.modules.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                {isUnlocked ? (
                  <Button 
                    className="w-full"
                    variant={status === "complete" ? "outline" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      cta.action();
                    }}
                  >
                    {cta.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Complete Essência para desbloquear
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Próximo Passo
          </h2>
          <div className="space-y-2">
            {nextActions.slice(0, 1).map((action, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer transition-colors"
                onClick={() => navigate(action.route)}
              >
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {action.pillar}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats - Minimal */}
      <div className="pt-6 border-t border-border/50">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-light text-foreground">{completedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Módulos</div>
          </div>
          <div>
            <div className="text-2xl font-light text-foreground">
              {pillars.filter(p => getPillarStatus(p.id) === "complete").length}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Pilares</div>
          </div>
          <div>
            <div className="text-2xl font-light text-foreground">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Em Andamento</div>
          </div>
          <div>
            <div className="text-2xl font-light text-foreground">{unlockedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Desbloqueados</div>
          </div>
        </div>
      </div>
    </div>
  );
}
