import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Lock,
  CheckCircle,
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
        title: "🎉 Novos pilares desbloqueados!",
        description: "Estrutura, Governança e Conselho agora estão disponíveis!",
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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {companyName ? `Olá, ${companyName}!` : "Bem-vindo!"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe sua jornada de transformação organizacional
        </p>
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar) => {
          const isUnlocked = isPillarUnlocked(pillar.id, essenciaComplete);
          const progress = getPillarProgress(pillar.id, completedModules);
          const status = getPillarStatus(pillar.id);
          const cta = getPillarCTA(pillar.id);

          return (
            <Card 
              key={pillar.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                isUnlocked 
                  ? "hover:shadow-lg hover:scale-[1.01] cursor-pointer" 
                  : "opacity-60"
              )}
              onClick={() => isUnlocked && cta.action()}
            >
              {/* Color accent bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: pillar.color }}
              />

              {/* Hybrid badge */}
              {pillar.isHybrid && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Híbrido
                  </span>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                      pillar.bgColor,
                      "text-white shadow-lg"
                    )}
                  >
                    {pillar.emoji}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {pillar.name}
                      {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                      {status === "complete" && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {status === "in-progress" && <Clock className="w-4 h-4 text-yellow-500" />}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{pillar.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                {isUnlocked && progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress.completed}/{progress.total} módulos</span>
                    </div>
                    <Progress 
                      value={progress.percentage} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Module list preview */}
                {isUnlocked && (
                  <div className="flex flex-wrap gap-2">
                    {pillar.modules.slice(0, 4).map((module) => {
                      const isCompleted = completedModules.includes(module.id);
                      return (
                        <span 
                          key={module.id}
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            isCompleted 
                              ? "bg-green-500/20 text-green-400" 
                              : module.isAvailable 
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted && "✓ "}
                          {module.name.replace(" Máxima", "").replace(" Máximo", "")}
                        </span>
                      );
                    })}
                    {pillar.modules.length > 4 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        +{pillar.modules.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                {isUnlocked ? (
                  <Button 
                    className="w-full gap-2"
                    style={{ 
                      backgroundColor: status === "complete" ? undefined : pillar.color,
                    }}
                    variant={status === "complete" ? "outline" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      cta.action();
                    }}
                  >
                    {cta.label}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Complete o Pilar Essência para desbloquear
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextActions.map((action, index) => {
                const pillar = PILLARS[action.pillar];
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => navigate(action.route)}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center text-sm",
                          pillar.bgColor,
                          "text-white"
                        )}
                      >
                        {pillar.emoji}
                      </span>
                      <span>{action.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{completedModules.length}</div>
          <div className="text-sm text-muted-foreground">Módulos Completos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">
            {pillars.filter(p => getPillarStatus(p.id) === "complete").length}
          </div>
          <div className="text-sm text-muted-foreground">Pilares Completos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">
            {pillars.filter(p => getPillarStatus(p.id) === "in-progress").length}
          </div>
          <div className="text-sm text-muted-foreground">Em Andamento</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-500">
            {pillars.filter(p => isPillarUnlocked(p.id, essenciaComplete)).length}
          </div>
          <div className="text-sm text-muted-foreground">Desbloqueados</div>
        </Card>
      </div>
    </div>
  );
}
