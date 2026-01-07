import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, Users, DollarSign, TrendingUp, Activity, ArrowLeft, UserCog, FileText, Shield, RefreshCw, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MentorshipManager } from "@/components/MentorshipManager";
import { PromptManager } from "@/components/PromptManager";
import { RolesManager } from "@/components/RolesManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

interface PendingMVV {
  id: string;
  company_name: string;
  created_at: string;
  user_email?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [pendingMVVs, setPendingMVVs] = useState<PendingMVV[]>([]);
  const [selectedPendingId, setSelectedPendingId] = useState<string>("");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [days]);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Acesso negado", { description: "Faça login para continuar" });
        navigate('/auth');
        return;
      }

      const { data: hasAdminRole, error: roleError } = await supabase
        .rpc('has_role', { 
          _user_id: user.id, 
          _role: 'admin' 
        });

      if (roleError || !hasAdminRole) {
        toast.error("Acesso negado", { description: "Você não tem permissão para acessar esta área." });
        navigate('/dashboard');
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Error checking admin:', error);
      toast.error("Erro ao verificar permissões");
      navigate('/dashboard');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load overview
      const overviewRes = await supabase.functions.invoke('admin-analytics', {
        body: { metric: 'overview' },
      });

      if (overviewRes.data) setOverview(overviewRes.data);

      // Load AI usage
      const aiUsageRes = await supabase.functions.invoke('admin-analytics', {
        body: { metric: 'ai_usage', days },
      });
      
      if (aiUsageRes.data) setAiUsage(aiUsageRes.data);

      // Load pending MVVs (documents without mission/vision)
      const { data: pending } = await supabase
        .from('mvv_documents')
        .select('id, company_name, created_at, user_id')
        .or('mission.is.null,vision.is.null')
        .order('created_at', { ascending: false })
        .limit(20);

      if (pending) {
        // Get user emails for display
        const userIds = [...new Set(pending.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
        
        setPendingMVVs(pending.map(p => ({
          id: p.id,
          company_name: p.company_name,
          created_at: p.created_at,
          user_email: profileMap.get(p.user_id),
        })));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePendingReport = async () => {
    if (!selectedPendingId) {
      toast.error("Selecione um documento");
      return;
    }

    setGeneratingReport(true);
    try {
      // Fetch conversation history
      const { data: history, error: historyError } = await supabase
        .from('conversation_history')
        .select('role, content')
        .eq('document_id', selectedPendingId)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;

      if (!history || history.length < 5) {
        toast.error("Conversa muito curta", { 
          description: "Este documento não tem histórico suficiente para gerar relatório." 
        });
        return;
      }

      // Build conversation text
      const conversationText = history
        .map(msg => `${msg.role === 'user' ? 'Cliente' : 'Consultor'}: ${msg.content}`)
        .join('\n\n');

      // Call generate-mvv
      const { data, error } = await supabase.functions.invoke('generate-mvv', {
        body: { conversationHistory: conversationText }
      });

      if (error) throw error;

      // Update the document
      const { error: updateError } = await supabase
        .from('mvv_documents')
        .update({
          company_name: data.company_name || 'Empresa',
          segment: data.segment || 'A definir',
          company_size: data.company_size,
          company_context: data.company_context,
          mission: data.mission,
          mission_pocket: data.mission_pocket,
          mission_punchline: data.mission_punchline,
          vision: data.vision,
          vision_indicators: data.vision_indicators,
          values: data.values,
        })
        .eq('id', selectedPendingId);

      if (updateError) throw updateError;

      toast.success("Relatório gerado com sucesso!", {
        description: "Redirecionando para o relatório..."
      });

      // Remove from pending list
      setPendingMVVs(prev => prev.filter(p => p.id !== selectedPendingId));
      setSelectedPendingId("");

      // Navigate to report
      setTimeout(() => navigate(`/relatorio/${selectedPendingId}`), 1000);

    } catch (error) {
      console.error('Error generating pending report:', error);
      toast.error("Erro ao gerar relatório", {
        description: "Verifique os logs para mais detalhes."
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Métricas e analytics da plataforma</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="w-4 h-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <FileText className="w-4 h-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="mentorship">
              <UserCog className="w-4 h-4 mr-2" />
              Mentoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-8 mt-6">

        {/* Pending MVV Reports */}
        {pendingMVVs.length > 0 && (
          <Card className="p-6 bg-card border-amber-500/30">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Relatórios MVV Pendentes</h2>
              <span className="text-sm text-muted-foreground">({pendingMVVs.length})</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Documentos com conversa mas sem relatório gerado (faltou o marcador [PRONTO_PARA_GERAR])
            </p>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select value={selectedPendingId} onValueChange={setSelectedPendingId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione um documento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingMVVs.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex flex-col">
                          <span>{doc.company_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.user_email} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGeneratePendingReport}
                disabled={!selectedPendingId || generatingReport}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Relatório"
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-3xl font-bold text-foreground">{overview?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold text-foreground">{overview?.totalLeads || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.conversionRate || 0}% conversão
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-secondary" />
            </div>
          </Card>

          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-foreground">
                  R$ {overview?.totalRevenue || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MRR: R$ {overview?.mrr || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-accent" />
            </div>
          </Card>

          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MVV Completos</p>
                <p className="text-3xl font-bold text-foreground">
                  {overview?.mvvStats?.completed || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.mvvStats?.completion_rate || 0}% taxa
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* AI Usage */}
        <Card className="p-6 bg-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Uso de IA</h2>
            <div className="flex gap-2">
              <Button
                variant={days === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(7)}
              >
                7 dias
              </Button>
              <Button
                variant={days === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(30)}
              >
                30 dias
              </Button>
              <Button
                variant={days === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(90)}
              >
                90 dias
              </Button>
            </div>
          </div>

          {aiUsage?.dailyStats && aiUsage.dailyStats.length > 0 ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Requests por Dia</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aiUsage.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="mvv_requests" stroke={COLORS[0]} name="MVV" />
                    <Line type="monotone" dataKey="cultura_requests" stroke={COLORS[1]} name="Cultura" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Tokens Consumidos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiUsage.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="total_tokens" fill={COLORS[2]} name="Total Tokens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum dado de uso de IA disponível</p>
          )}
        </Card>

        {/* Module Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card">
            <h3 className="text-xl font-bold mb-4 text-foreground">MVV Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-foreground">{overview?.mvvStats?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completos:</span>
                <span className="font-semibold text-foreground">{overview?.mvvStats?.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Conclusão:</span>
                <span className="font-semibold text-foreground">{overview?.mvvStats?.completion_rate || 0}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card">
            <h3 className="text-xl font-bold mb-4 text-foreground">Cultura Máxima Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-foreground">{overview?.cultureStats?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completos:</span>
                <span className="font-semibold text-foreground">{overview?.cultureStats?.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Conclusão:</span>
                <span className="font-semibold text-foreground">{overview?.cultureStats?.completion_rate || 0}%</span>
              </div>
            </div>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <RolesManager />
          </TabsContent>

          <TabsContent value="prompts" className="mt-6">
            <PromptManager />
          </TabsContent>

          <TabsContent value="mentorship" className="mt-6">
            <MentorshipManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
