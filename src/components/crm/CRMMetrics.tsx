import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Users, TrendingUp, Target, Percent } from "lucide-react";
import { CompanyCRM, PIPELINE_STAGES, ACCESS_TYPES } from "./types";

interface CRMMetricsProps {
  companies: CompanyCRM[];
}

export function CRMMetrics({ companies }: CRMMetricsProps) {
  const metrics = useMemo(() => {
    const total = companies.length;
    
    const byStage = PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = companies.filter(c => c.pipeline_stage === stage.id).length;
      return acc;
    }, {} as Record<string, number>);

    const byAccess = ACCESS_TYPES.reduce((acc, access) => {
      acc[access.id] = companies.filter(c => c.access_type === access.id).length;
      return acc;
    }, {} as Record<string, number>);

    // Funnel calculations
    const leads = byStage.lead || 0;
    const essenciaAndamento = byStage.essencia_andamento || 0;
    const essenciaConcluida = byStage.essencia_concluida || 0;
    const contatoQualificado = byStage.contato_qualificado || 0;
    const propostaAberta = byStage.proposta_aberta || 0;
    const clienteAtivo = byStage.cliente_ativo || 0;

    // Lead → Essência Iniciada
    const leadToEssencia = leads > 0 
      ? ((essenciaAndamento + essenciaConcluida + contatoQualificado + propostaAberta + clienteAtivo) / (leads + essenciaAndamento + essenciaConcluida + contatoQualificado + propostaAberta + clienteAtivo)) * 100
      : 0;

    // Essência Concluída → Contato
    const totalAfterEssencia = essenciaConcluida + contatoQualificado + propostaAberta + clienteAtivo;
    const essenciaToContato = totalAfterEssencia > 0
      ? ((contatoQualificado + propostaAberta + clienteAtivo) / totalAfterEssencia) * 100
      : 0;

    // Contato → Proposta
    const totalAfterContato = contatoQualificado + propostaAberta + clienteAtivo;
    const contatoToProposta = totalAfterContato > 0
      ? ((propostaAberta + clienteAtivo) / totalAfterContato) * 100
      : 0;

    // Proposta → Cliente
    const totalAfterProposta = propostaAberta + clienteAtivo;
    const propostaToCliente = totalAfterProposta > 0
      ? (clienteAtivo / totalAfterProposta) * 100
      : 0;

    // By partner
    const byPartner: Record<string, number> = {};
    companies.forEach(c => {
      const partner = c.partner_origin || 'Direto';
      byPartner[partner] = (byPartner[partner] || 0) + 1;
    });

    // Clients by partner
    const clientsByPartner: Record<string, number> = {};
    companies.filter(c => c.pipeline_stage === 'cliente_ativo').forEach(c => {
      const partner = c.partner_origin || 'Direto';
      clientsByPartner[partner] = (clientsByPartner[partner] || 0) + 1;
    });

    return {
      total,
      byStage,
      byAccess,
      funnel: {
        leadToEssencia,
        essenciaToContato,
        contatoToProposta,
        propostaToCliente,
      },
      byPartner,
      clientsByPartner,
      counts: {
        leads,
        essenciaAndamento,
        essenciaConcluida,
        contatoQualificado,
        propostaAberta,
        clienteAtivo,
      }
    };
  }, [companies]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-xs text-muted-foreground">Total Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.counts.clienteAtivo}</p>
                <p className="text-xs text-muted-foreground">Clientes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.counts.propostaAberta}</p>
                <p className="text-xs text-muted-foreground">Propostas Abertas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Percent className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.funnel.propostaToCliente.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Conv. Proposta→Cliente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FunnelStep 
            from="Lead" 
            to="Essência Iniciada" 
            rate={metrics.funnel.leadToEssencia}
            fromCount={metrics.counts.leads}
            toCount={metrics.counts.essenciaAndamento + metrics.counts.essenciaConcluida + metrics.counts.contatoQualificado + metrics.counts.propostaAberta + metrics.counts.clienteAtivo}
          />
          <FunnelStep 
            from="Essência Concluída" 
            to="Contato" 
            rate={metrics.funnel.essenciaToContato}
            fromCount={metrics.counts.essenciaConcluida}
            toCount={metrics.counts.contatoQualificado + metrics.counts.propostaAberta + metrics.counts.clienteAtivo}
          />
          <FunnelStep 
            from="Contato" 
            to="Proposta" 
            rate={metrics.funnel.contatoToProposta}
            fromCount={metrics.counts.contatoQualificado}
            toCount={metrics.counts.propostaAberta + metrics.counts.clienteAtivo}
          />
          <FunnelStep 
            from="Proposta" 
            to="Cliente" 
            rate={metrics.funnel.propostaToCliente}
            fromCount={metrics.counts.propostaAberta}
            toCount={metrics.counts.clienteAtivo}
          />
        </CardContent>
      </Card>

      {/* By Access Type & Partner */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Tipo de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ACCESS_TYPES.map(access => {
              const count = metrics.byAccess[access.id] || 0;
              const pct = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
              return (
                <div key={access.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{access.icon} {access.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Parceiro de Origem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(metrics.byPartner)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([partner, count]) => {
                const pct = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
                const clients = metrics.clientsByPartner[partner] || 0;
                return (
                  <div key={partner} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{partner}</span>
                      <span className="font-medium">{count} <span className="text-xs text-muted-foreground">({clients} clientes)</span></span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FunnelStep({ from, to, rate, fromCount, toCount }: { from: string; to: string; rate: number; fromCount: number; toCount: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 text-right">
        <p className="text-sm font-medium">{from}</p>
        <p className="text-xs text-muted-foreground">{fromCount}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="w-16 text-center">
          <span className={`text-sm font-bold ${rate >= 50 ? 'text-green-600' : rate >= 25 ? 'text-yellow-600' : 'text-red-500'}`}>
            {rate.toFixed(0)}%
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{to}</p>
        <p className="text-xs text-muted-foreground">{toCount}</p>
      </div>
    </div>
  );
}
