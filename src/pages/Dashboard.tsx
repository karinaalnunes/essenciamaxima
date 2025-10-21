import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, LogOut, CheckCircle, Clock, TrendingUp, Network, Users, GitBranch, Workflow, BarChart3, Heart, ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { useToast } from "@/hooks/use-toast";
import { ModuleCard } from "@/components/ModuleCard";
import { UpsellEssenciaMaxima } from "@/components/UpsellEssenciaMaxima";

const FUTURE_MODULES = [
  { 
    id: "essencia", 
    title: "Essência Máxima", 
    description: "Missão, Visão e Valores",
    icon: CheckCircle,
    locked: false
  },
  { 
    id: "cadeia-valor", 
    title: "Cadeia de Valor Máxima", 
    icon: TrendingUp,
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
    id: "processos", 
    title: "Processos Máxima", 
    description: "Fluxos Detalhados",
    icon: Workflow,
    locked: true
  },
  { 
    id: "indicadores", 
    title: "Indicadores Máxima", 
    description: "Dashboard da Empresa",
    icon: BarChart3,
    locked: true
  },
  { 
    id: "cultura", 
    title: "Cultura Máxima", 
    description: "Código de Cultura Completo",
    icon: Heart,
    locked: false
  },
];

type MVVStatus = 'none' | 'incomplete' | 'complete';
type CultureStatus = 'none' | 'incomplete' | 'complete';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [cultureDocument, setCultureDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mvvStatus, setMvvStatus] = useState<MVVStatus>('none');
  const [cultureStatus, setCultureStatus] = useState<CultureStatus>('none');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
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

        // Buscar documento de Cultura se MVV completo
        if (isComplete) {
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

          {/* Card Cultura Máxima - só aparece se MVV completo */}
          {mvvStatus === 'complete' && cultureStatus === 'none' && (
            <Card className="bg-slate-800/50 border-purple-500/50 p-6 mt-4">
              <div className="flex items-start gap-4">
                <Heart className="text-purple-400 w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">💜 Cultura Máxima</h3>
                  <p className="text-slate-400 mb-2">Código de Cultura Completo</p>
                  <p className="text-sm text-slate-400">
                    Expanda seu MVV com um Código de Cultura completo: princípios norteadores, rituais, desenvolvimento de pessoas e plano de ação 30/60/90/120 dias.
                  </p>
                </div>
                <Button onClick={() => navigate("/novo-cultura")}>
                  Iniciar <ArrowRight className="w-4 h-4 ml-2" />
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