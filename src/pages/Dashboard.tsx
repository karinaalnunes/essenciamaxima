import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, LogOut, CheckCircle, Clock, TrendingUp, Network, Users, GitBranch, Workflow, BarChart3, Heart, ArrowRight, Loader2, Lock } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { ModuleCard } from "@/components/ModuleCard";
import { UpsellEssenciaMaxima } from "@/components/UpsellEssenciaMaxima";
import { AchievementBadge } from "@/components/AchievementBadge";
import { MODULE_GAINS, getModuleStatus } from "@/config/moduleGains";

const FUTURE_MODULES = [
  { 
    id: "essencia", 
    title: "Essência Máxima", 
    description: "Missão, Visão e Valores",
    icon: CheckCircle,
    locked: false
  },
  { 
    id: "cultura", 
    title: "Cultura Máxima", 
    description: "Código de Cultura Completo",
    icon: Heart,
    locked: false
  },
  { 
    id: "processos", 
    title: "Processos Máxima", 
    description: "Fluxos Detalhados",
    icon: Workflow,
    locked: true
  },
  { 
    id: "estrutura", 
    title: "Estrutura Máxima", 
    description: "Organograma",
    icon: Network,
    locked: true
  },
  { 
    id: "funcoes", 
    title: "Funções Máxima", 
    description: "Descrição de Funções",
    icon: Users,
    locked: true
  },
  { 
    id: "fluxo", 
    title: "Fluxo Máxima", 
    description: "Macrofluxo",
    icon: GitBranch,
    locked: true
  },
  { 
    id: "indicadores", 
    title: "Indicadores Máxima", 
    description: "Dashboard da Empresa",
    icon: BarChart3,
    locked: true
  },
];

type MVVStatus = 'none' | 'incomplete' | 'complete';
type CultureStatus = 'none' | 'incomplete' | 'complete';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fireConfetti } = useConfetti();
  
  const [user, setUser] = useState<any>(null);
  const [previousCultureStatus, setPreviousCultureStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [cultureDocument, setCultureDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mvvStatus, setMvvStatus] = useState<MVVStatus>('none');
  const [cultureStatus, setCultureStatus] = useState<CultureStatus>('none');
  const [hasCulturaPurchase, setHasCulturaPurchase] = useState(false);
  const [hasCompletedAnamnesis, setHasCompletedAnamnesis] = useState(false);
  const [valueChainStatus, setValueChainStatus] = useState<'none' | 'incomplete' | 'complete'>('none');
  const [valueChainDoc, setValueChainDoc] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      // Check admin status using has_role function
      const { data: hasAdminRole } = await supabase
        .rpc('has_role', { 
          _user_id: session.user.id, 
          _role: 'admin' 
        });
      
      if (hasAdminRole) {
        setIsAdmin(true);
      }
      
      // Buscar documento MVV do usuário
      const { data: docs } = await supabase
        .from("mvv_documents")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!docs || docs.length === 0) {
        setMvvStatus('none');
      } else {
        const doc = docs[0];
        setDocument(doc);
        const isComplete = doc.mission && doc.vision && doc.values;
        setMvvStatus(isComplete ? 'complete' : 'incomplete');

        // Verificar compra do Cultura Máxima se MVV completo
        if (isComplete) {
          // Verificar se comprou Cultura Máxima
          const { data: purchases } = await supabase
            .from("purchases")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("product_type", "cultura_maxima")
            .in("status", ["completed", "succeeded"])
            .limit(1);

          const hasPurchase = purchases && purchases.length > 0;
          setHasCulturaPurchase(hasPurchase);

          // Se comprou, verificar anamnese
          if (hasPurchase) {
            const { data: anamnesis } = await supabase
              .from("organizational_anamnesis")
              .select("*")
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: false })
              .limit(1);

            const hasAnamnesis = anamnesis && anamnesis.length > 0 && !!anamnesis[0].completed_at;
            setHasCompletedAnamnesis(hasAnamnesis);

            // Se completou anamnese, buscar documento de cultura
            if (hasAnamnesis) {
              const { data: cultureDocs } = await supabase
                .from("culture_documents")
                .select("*")
                .eq("user_id", session.user.id)
                .eq("mvv_document_id", doc.id)
                .order("created_at", { ascending: false });

              if (!cultureDocs || cultureDocs.length === 0) {
                setCultureStatus('none');
              } else {
                const cultureDoc = cultureDocs[0];
                setCultureDocument(cultureDoc);
                const principles = Array.isArray(cultureDoc.guiding_principles) ? cultureDoc.guiding_principles : [];
                const cultureComplete = cultureDoc.reputation_goal && principles.length > 0;
                setCultureStatus(cultureComplete ? 'complete' : 'incomplete');
              }

              // Check value chain documents
              const { data: valueChainDocs } = await supabase
                .from("value_chain_documents")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false });

              if (!valueChainDocs || valueChainDocs.length === 0) {
                setValueChainStatus('none');
              } else {
                const vcDoc = valueChainDocs[0] as any;
                setValueChainDoc(vcDoc);
                const isComplete = vcDoc.status === 'completed' && vcDoc.activities && Array.isArray(vcDoc.activities) && vcDoc.activities.length > 0;
                setValueChainStatus(isComplete ? 'complete' : 'incomplete');
              }
            }
          }
        }
      }

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

  // Confetti quando desbloquear Cadeia de Valor
  useEffect(() => {
    if (previousCultureStatus !== null && previousCultureStatus !== 'complete' && cultureStatus === 'complete') {
      fireConfetti('intense');
      toast({
        title: "🎉 Novo módulo desbloqueado!",
        description: "A Cadeia de Valor Máxima agora está disponível!",
      });
    }
    setPreviousCultureStatus(cultureStatus);
  }, [cultureStatus, fireConfetti, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-8 antialiased">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Máxima iA" className="h-16 md:h-20 w-auto" />
          
          {user && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/70 rounded-full border border-slate-600/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">
                {user.email}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/admin')}
            >
              Admin Dashboard
            </Button>
          )}
          <Link to="/perfil">
            <Button variant="outline" size="sm">
              Perfil
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.clear();
              sessionStorage.clear();
              navigate("/auth");
            }}
          >
            Trocar de Conta
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Trilha de Consultoria Estratégica
          </h1>
          <p className="text-slate-300 text-lg">
            Acompanhe sua jornada de transformação organizacional
          </p>
        </div>

        {/* Seção: Seu Progresso */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Seu Progresso</h2>
          
          {mvvStatus === 'none' && (
            <Card className="bg-slate-800/50 border-slate-700/50 p-12 text-center space-y-4">
              <FileText className="w-16 h-16 mx-auto text-slate-500" />
              <h3 className="text-2xl font-bold text-white">Nenhum documento ainda</h3>
              <p className="text-slate-300">
                Comece criando seu documento MVV
              </p>
              <Link to="/novo-mvv">
                <Button className="mt-4">Criar MVV</Button>
              </Link>
            </Card>
          )}

          {mvvStatus === 'incomplete' && (
            <Card className="bg-slate-800/50 border-yellow-500/50 p-6">
              <div className="flex items-start gap-4">
                <Clock className="text-yellow-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">🔄 Essência Máxima (MVV)</h3>
                  <p className="text-slate-400 mb-2">Em andamento</p>
                  {document && (
                    <p className="text-sm text-slate-400">
                      {document.company_name} • {document.segment}
                    </p>
                  )}
                </div>
                <Button onClick={() => navigate(`/novo-mvv?doc=${document.id}`)}>
                  Continuar Consultoria
                </Button>
              </div>
            </Card>
          )}

          {mvvStatus === 'complete' && document && (
            <Card className="bg-slate-800/50 border-green-500/50 p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">✅ Essência Máxima (MVV)</h3>
                  <p className="text-slate-400 mb-2">
                    Completo em {new Date(document.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
                    {document.company_name} • {document.segment}
                  </p>
                  
                  {/* Micro-mentoring tip */}
                  <div className="mt-4 p-3 bg-blue-950/30 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-slate-300">
                      💡 <strong className="text-blue-300">Próximo passo recomendado:</strong>{" "}
                      Compartilhe seu MVV com a equipe em uma reunião de alinhamento.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/relatorio/${document.id}`)}>
                    Ver Relatório
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Card Cultura Máxima - fluxo com checkout e anamnese */}
          {mvvStatus === 'complete' && !hasCulturaPurchase && (
            <Card className="bg-slate-800/50 border-purple-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <Heart className="text-purple-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">💜 Cultura Máxima</h3>
                  <p className="text-slate-400 mb-2">Código de Cultura Completo</p>
                  <p className="text-sm text-slate-400">
                    Expanda seu MVV com um Código de Cultura completo: diagnóstico organizacional, princípios norteadores, rituais e plano de ação 30/60/90/120 dias.
                  </p>
                </div>
                <Button onClick={() => navigate("/checkout-cultura")}>
                  Adquirir <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {mvvStatus === 'complete' && hasCulturaPurchase && !hasCompletedAnamnesis && (
            <Card className="bg-slate-800/50 border-yellow-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <Heart className="text-yellow-400 w-8 h-8 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">🔄 Complete sua Anamnese Máxima</h3>
                  <p className="text-slate-400 mb-2">Diagnóstico Organizacional Pendente</p>
                  <p className="text-sm text-slate-400">
                    Antes de criar seu Código de Cultura, complete o diagnóstico organizacional para personalizar as recomendações.
                  </p>
                </div>
                <Button onClick={() => navigate("/anamnese-cultura")}>
                  Continuar Anamnese <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {mvvStatus === 'complete' && hasCulturaPurchase && hasCompletedAnamnesis && cultureStatus === 'none' && (
            <Card className="bg-slate-800/50 border-green-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <Heart className="text-green-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">✅ Anamnese Completa - Iniciar Cultura</h3>
                  <p className="text-slate-400 mb-2">Código de Cultura Personalizado</p>
                  <p className="text-sm text-slate-400">
                    Diagnóstico concluído! Agora crie seu Código de Cultura baseado no contexto real da sua empresa.
                  </p>
                </div>
                <Button onClick={() => navigate("/novo-cultura")}>
                  Iniciar Cultura <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {mvvStatus === 'complete' && cultureStatus === 'incomplete' && cultureDocument && (
            <Card className="bg-slate-800/50 border-yellow-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <Clock className="text-yellow-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">🔄 Cultura Máxima</h3>
                  <p className="text-slate-400 mb-2">Em andamento</p>
                  <p className="text-sm text-slate-400">
                    Continue estruturando o Código de Cultura da sua empresa
                  </p>
                </div>
                <Button onClick={() => navigate("/novo-cultura")}>
                  Continuar Consultoria
                </Button>
              </div>
            </Card>
          )}

          {mvvStatus === 'complete' && cultureStatus === 'complete' && cultureDocument && (
            <Card className="bg-slate-800/50 border-green-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">✅ Cultura Máxima</h3>
                  <p className="text-slate-400 mb-2">
                    Completo em {new Date(cultureDocument.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-slate-400">
                    Código de Cultura Completo com Plano de Ação 30/60/90/120 dias
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/relatorio-cultura/${cultureDocument.id}`)}>
                    Ver Relatório
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Cadeia de Valor Máxima - Card Bloqueado por MVV */}
          {mvvStatus !== 'complete' && (
            <Card className="bg-slate-800/30 border-slate-600/50 p-6 mt-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
                <Lock className="w-12 h-12 text-slate-400/70" />
              </div>
              <div className="flex items-start gap-4 opacity-60">
                <TrendingUp className="text-slate-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">📊 Cadeia de Valor Máxima 2.0</h3>
                  <p className="text-slate-400 mb-2">Bloqueado - Complete o Essência Máxima (MVV) primeiro</p>
                  <p className="text-sm text-slate-400">
                    Mapeamento estratégico do macrofluxo empresarial disponível após conclusão do MVV e Cultura Máxima
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/novo-mvv")}
                  className="relative z-20"
                >
                  {mvvStatus === 'none' ? "Iniciar MVV" : "Continuar MVV"}
                </Button>
              </div>
            </Card>
          )}

          {/* Cadeia de Valor Máxima - Card Bloqueado por Cultura */}
          {mvvStatus === 'complete' && cultureStatus !== 'complete' && (
            <Card className="bg-slate-800/30 border-slate-600/50 p-6 mt-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
                <Lock className="w-12 h-12 text-slate-400/70" />
              </div>
              <div className="flex items-start gap-4 opacity-60">
                <TrendingUp className="text-slate-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">📊 Cadeia de Valor Máxima 2.0</h3>
                  <p className="text-slate-400 mb-2">Bloqueado - Complete o Cultura Máxima primeiro</p>
                  <p className="text-sm text-slate-400">
                    Mapeamento estratégico do macrofluxo empresarial disponível após conclusão do Cultura Máxima
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (!hasCulturaPurchase) {
                      navigate("/checkout-cultura");
                    } else if (!hasCompletedAnamnesis) {
                      navigate("/anamnese-cultura");
                    } else {
                      navigate("/novo-cultura");
                    }
                  }}
                  className="relative z-20"
                >
                  {!hasCulturaPurchase ? "Adquirir Cultura Máxima" : !hasCompletedAnamnesis ? "Completar Anamnese" : "Iniciar Cultura"}
                </Button>
              </div>
            </Card>
          )}

          {/* Cadeia de Valor Máxima - Card Desbloqueado */}
          {cultureStatus === 'complete' && valueChainStatus === 'none' && (
            <Card className="bg-slate-800/50 border-blue-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <TrendingUp className="text-blue-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">📊 Cadeia de Valor Máxima 2.0</h3>
                  <p className="text-slate-400 mb-2">Mapeamento estratégico do macrofluxo empresarial</p>
                  <p className="text-sm text-slate-400">
                    Análise completa de atividades, matriz de valor agregado e checkpoint emocional
                  </p>
                </div>
                <Button onClick={() => navigate("/novo-valor-cadeia")}>
                  Iniciar Mapeamento
                </Button>
              </div>
            </Card>
          )}

          {cultureStatus === 'complete' && valueChainStatus === 'incomplete' && (
            <Card className="bg-slate-800/50 border-yellow-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <Clock className="text-yellow-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">🔄 Cadeia de Valor Máxima</h3>
                  <p className="text-slate-400 mb-2">Em andamento</p>
                  <p className="text-sm text-slate-400">
                    Continue mapeando a cadeia de valor da sua empresa
                  </p>
                </div>
                <Button onClick={() => navigate("/novo-valor-cadeia")}>
                  Continuar Mapeamento
                </Button>
              </div>
            </Card>
          )}

          {cultureStatus === 'complete' && valueChainStatus === 'complete' && valueChainDoc && (
            <Card className="bg-slate-800/50 border-green-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">✅ Cadeia de Valor Máxima</h3>
                  <p className="text-slate-400 mb-2">
                    Completo em {new Date(valueChainDoc.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-slate-400">
                    Análise estratégica completa com matriz de valor agregado
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/relatorio-valor-cadeia/${valueChainDoc.id}`)}>
                    Ver Relatório
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Seção: Conquistas */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🏆 Suas Conquistas</h2>
            <Button 
              variant="outline" 
              onClick={() => navigate("/vitorias")}
              className="gap-2"
            >
              Ver Todas as Vitórias
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AchievementBadge
              emoji={MODULE_GAINS.mvv.emoji}
              name={MODULE_GAINS.mvv.name}
              status={getModuleStatus('mvv', mvvStatus, cultureStatus, valueChainStatus, 'none')}
              color={MODULE_GAINS.mvv.color}
            />
            <AchievementBadge
              emoji={MODULE_GAINS.cultura.emoji}
              name={MODULE_GAINS.cultura.name}
              status={getModuleStatus('cultura', mvvStatus, cultureStatus, valueChainStatus, 'none')}
              color={MODULE_GAINS.cultura.color}
            />
            <AchievementBadge
              emoji={MODULE_GAINS.valorChain.emoji}
              name={MODULE_GAINS.valorChain.name}
              status={getModuleStatus('valorChain', mvvStatus, cultureStatus, valueChainStatus, 'none')}
              color={MODULE_GAINS.valorChain.color}
            />
            <AchievementBadge
              emoji={MODULE_GAINS.processos.emoji}
              name={MODULE_GAINS.processos.name}
              status={getModuleStatus('processos', mvvStatus, cultureStatus, valueChainStatus, 'none')}
              color={MODULE_GAINS.processos.color}
            />
          </div>
        </div>

        {/* Seção: Próximos Módulos */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Próximos Módulos da Trilha
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUTURE_MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                locked={module.locked}
              />
            ))}
          </div>
        </div>

        {/* Card de Upsell Essência Máxima (apenas se MVV completo) */}
        {mvvStatus === 'complete' && (
          <div className="mt-12">
            <UpsellEssenciaMaxima />
          </div>
        )}
      </main>
    </div>
  );
}