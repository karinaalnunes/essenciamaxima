import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, Users, DollarSign, TrendingUp, Activity, ArrowLeft } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [days, setDays] = useState(30);

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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Load overview
      const overviewRes = await supabase.functions.invoke('admin-analytics', {
        body: {},
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (overviewRes.data) setOverview(overviewRes.data);

      // Load AI usage
      const aiUsageRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics?metric=ai_usage&days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (aiUsageRes.ok) {
        const aiData = await aiUsageRes.json();
        setAiUsage(aiData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
}
