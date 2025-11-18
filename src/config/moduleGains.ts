export interface ModuleGain {
  title: string;
  description: string;
}

export interface ModuleGainConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  gains: ModuleGain[];
  reportRoute?: string;
}

export const MODULE_GAINS: Record<string, ModuleGainConfig> = {
  mvv: {
    id: 'mvv',
    name: 'Essência Máxima (MVV)',
    emoji: '🎯',
    color: 'hsl(var(--primary))',
    reportRoute: '/relatorio-mvv',
    gains: [
      {
        title: '🎯 Clareza Estratégica',
        description: 'Propósito, Missão e Visão definidos e alinhados com a realidade do negócio'
      },
      {
        title: '💎 Valores Operacionalizados',
        description: 'Valores empresariais transformados em comportamentos práticos e mensuráveis'
      },
      {
        title: '📊 Indicadores de Visão',
        description: 'Métricas claras para acompanhar o progresso rumo aos objetivos de longo prazo'
      },
      {
        title: '🎨 Identidade Única',
        description: 'Diferenciação competitiva clara no mercado e posicionamento estratégico definido'
      },
      {
        title: '🧭 Direcionamento Decisório',
        description: 'Base sólida para todas as decisões estratégicas e operacionais da empresa'
      }
    ]
  },
  cultura: {
    id: 'cultura',
    name: 'Cultura Máxima',
    emoji: '🌟',
    color: 'hsl(280, 100%, 70%)',
    reportRoute: '/relatorio-cultura',
    gains: [
      {
        title: '🏆 Cultura Estratégica',
        description: 'Ambiente organizacional alinhado aos valores e propósito da empresa'
      },
      {
        title: '🎭 Rituais Culturais',
        description: 'Práticas e cerimônias que reforçam a identidade cultural diariamente'
      },
      {
        title: '📋 Princípios Norteadores',
        description: 'Diretrizes claras que guiam comportamentos e decisões do time'
      },
      {
        title: '🎯 Plano de Ação 120 dias',
        description: 'Roadmap estruturado para implementação cultural em 4 ciclos'
      },
      {
        title: '💪 Fortalecimento do Time',
        description: 'Práticas de segurança psicológica, crescimento e bem-estar implementadas'
      },
      {
        title: '🎨 Símbolos e Linguagem',
        description: 'Elementos visuais e comunicacionais que materializam a cultura'
      }
    ]
  },
  valorChain: {
    id: 'valorChain',
    name: 'Cadeia de Valor Máxima',
    emoji: '📊',
    color: 'hsl(200, 100%, 60%)',
    reportRoute: '/relatorio-valor-cadeia',
    gains: [
      {
        title: '🔍 Visão Sistêmica',
        description: 'Mapeamento completo do macrofluxo e atividades estratégicas da empresa'
      },
      {
        title: '📈 Priorização Estratégica',
        description: 'Identificação clara das atividades de maior impacto no negócio'
      },
      {
        title: '💰 Otimização de Investimentos',
        description: 'Direcionamento preciso de recursos para as áreas críticas'
      },
      {
        title: '🎯 Maturidade Mapeada',
        description: 'Diagnóstico do nível de desenvolvimento de cada área da empresa'
      },
      {
        title: '🚀 Plano de Evolução',
        description: 'Recomendações práticas para elevar a performance de cada atividade'
      },
      {
        title: '🔗 Integração Estratégica',
        description: 'Compreensão de como cada área contribui para o valor total entregue'
      }
    ]
  },
  processos: {
    id: 'processos',
    name: 'Processos Máxima',
    emoji: '⚙️',
    color: 'hsl(150, 100%, 60%)',
    gains: [
      {
        title: '📋 Processos Mapeados',
        description: 'Fluxos operacionais documentados e padronizados'
      },
      {
        title: '⚡ Eficiência Operacional',
        description: 'Identificação e eliminação de gargalos e desperdícios'
      },
      {
        title: '🎯 Indicadores de Performance',
        description: 'KPIs claros para monitorar a saúde dos processos'
      },
      {
        title: '🔄 Melhoria Contínua',
        description: 'Cultura de otimização e evolução constante dos fluxos'
      },
      {
        title: '👥 Clareza de Papéis',
        description: 'Responsabilidades definidas em cada etapa dos processos'
      }
    ]
  }
};

export const getModuleStatus = (
  moduleId: string,
  mvvStatus: string,
  cultureStatus: string,
  valueChainStatus: string,
  processStatus: string
): 'complete' | 'in-progress' | 'locked' => {
  const statusMap: Record<string, string> = {
    mvv: mvvStatus,
    cultura: cultureStatus,
    valorChain: valueChainStatus,
    processos: processStatus
  };

  const status = statusMap[moduleId];
  if (status === 'complete') return 'complete';
  if (status === 'incomplete') return 'in-progress';
  return 'locked';
};
