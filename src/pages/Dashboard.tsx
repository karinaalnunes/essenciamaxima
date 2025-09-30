import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, LogOut } from "lucide-react";
import logo from "@/assets/logo-maxima-ia.png";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCompletedMVV, setHasCompletedMVV] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      // Buscar documentos do usuário
      const { data: docs } = await supabase
        .from("mvv_documents")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setDocuments(docs || []);

      // Verificar se já tem MVV completo (trial limit)
      const completedMVV = docs?.some(
        doc => doc.mission && doc.vision && doc.values
      );
      setHasCompletedMVV(completedMVV || false);

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
        <img src={logo} alt="Máxima iA" className="h-12 w-auto" />
        <div className="flex items-center gap-4">
          <Link to="/perfil">
            <Button variant="outline" size="sm">
              Perfil
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Seus Documentos <span className="bg-gradient-text bg-clip-text text-transparent">MVV</span>
            </h1>
            <p className="text-slate-300 text-lg">
              Crie e gerencie suas definições de Missão, Visão e Valores
            </p>
          </div>
          {!hasCompletedMVV && (
            <Link to="/novo-mvv">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Novo MVV
              </Button>
            </Link>
          )}
        </div>

        {hasCompletedMVV && (
          <Card className="bg-slate-800/50 border-slate-700/50 p-6 text-center">
            <p className="text-slate-300 mb-4">
              ✨ Você já completou seu trial gratuito. Para criar mais documentos MVV, entre em contato com nosso time comercial.
            </p>
            <Button
              onClick={() => window.location.href = "mailto:contato@maximaia.com.br?subject=Interesse em mais MVVs"}
              variant="outline"
            >
              Falar com Comercial
            </Button>
          </Card>
        )}

        {documents.length === 0 && !hasCompletedMVV ? (
          <Card className="bg-slate-800/50 border-slate-700/50 p-12 text-center space-y-4">
            <FileText className="w-16 h-16 mx-auto text-slate-500" />
            <h2 className="text-2xl font-bold text-white">Nenhum documento ainda</h2>
            <p className="text-slate-300">
              Comece criando seu primeiro documento MVV
            </p>
            <Link to="/novo-mvv">
              <Button className="mt-4">Criar Primeiro MVV</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Link key={doc.id} to={`/documento/${doc.id}`}>
                <Card className="bg-slate-800/50 border-slate-700/50 p-6 hover:border-primary/50 transition-all hover:scale-105 cursor-pointer">
                  <h3 className="text-xl font-bold text-white mb-2">{doc.title}</h3>
                  <p className="text-slate-300 text-sm mb-4">{doc.company_name}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                      {doc.segment}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}