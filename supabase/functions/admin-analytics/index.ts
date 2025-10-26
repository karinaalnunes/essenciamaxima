import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar se usuário é admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

    if (roleError || !hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const metric = url.searchParams.get('metric') || 'overview';
    const days = parseInt(url.searchParams.get('days') || '30');

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    let data: any = {};

    switch (metric) {
      case 'overview': {
        // Total de usuários
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Estatísticas MVV
        const { data: mvvStats } = await supabase.rpc('get_mvv_completion_rate');
        
        // Estatísticas Cultura
        const { data: cultureStats } = await supabase.rpc('get_culture_completion_rate');

        // Total de leads
        const { count: totalLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });

        // Conversões (leads que viraram usuários)
        const { count: conversions } = await supabase
          .from('lead_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'converted');

        // Compras
        const { count: totalPurchases, data: purchasesData } = await supabase
          .from('purchases')
          .select('amount', { count: 'exact' })
          .eq('status', 'completed');

        const totalRevenue = purchasesData?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

        data = {
          totalUsers,
          totalLeads,
          conversions,
          conversionRate: totalLeads ? ((conversions || 0) / totalLeads * 100).toFixed(2) : 0,
          mvvStats: mvvStats?.[0] || { total: 0, completed: 0, completion_rate: 0 },
          cultureStats: cultureStats?.[0] || { total: 0, completed: 0, completion_rate: 0 },
          totalPurchases,
          totalRevenue: totalRevenue.toFixed(2),
          mrr: (totalRevenue / days * 30).toFixed(2), // Estimativa de MRR
        };
        break;
      }

      case 'ai_usage': {
        const { data: usageLogs } = await supabase
          .from('ai_usage_logs')
          .select('*')
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false });

        // Agregar por dia
        const dailyStats: any = {};
        usageLogs?.forEach((log: any) => {
          const date = new Date(log.created_at).toISOString().split('T')[0];
          if (!dailyStats[date]) {
            dailyStats[date] = {
              date,
              mvv_requests: 0,
              cultura_requests: 0,
              total_tokens: 0,
              avg_latency: [],
            };
          }
          if (log.module === 'mvv') dailyStats[date].mvv_requests++;
          if (log.module === 'cultura') dailyStats[date].cultura_requests++;
          dailyStats[date].total_tokens += (log.tokens_input || 0) + (log.tokens_output || 0);
          dailyStats[date].avg_latency.push(log.latency_ms);
        });

        // Calcular médias
        Object.values(dailyStats).forEach((stat: any) => {
          stat.avg_latency = stat.avg_latency.length 
            ? Math.round(stat.avg_latency.reduce((a: number, b: number) => a + b, 0) / stat.avg_latency.length)
            : 0;
        });

        data = {
          dailyStats: Object.values(dailyStats),
          totalLogs: usageLogs?.length || 0,
        };
        break;
      }

      case 'leads': {
        const { data: leadEvents } = await supabase
          .from('lead_events')
          .select('*')
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false });

        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        data = {
          leadEvents,
          leads,
        };
        break;
      }

      case 'conversations': {
        const { data: conversations } = await supabase
          .from('conversation_metrics')
          .select('*')
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false });

        // Estatísticas por status
        const statusStats = conversations?.reduce((acc: any, conv: any) => {
          acc[conv.status] = (acc[conv.status] || 0) + 1;
          return acc;
        }, {});

        data = {
          conversations,
          statusStats,
          totalConversations: conversations?.length || 0,
        };
        break;
      }

      case 'purchases': {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('*')
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false });

        data = { purchases };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid metric type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-analytics:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
