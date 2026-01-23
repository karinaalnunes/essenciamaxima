import { 
  Target, 
  Heart, 
  FileText,
  TrendingUp, 
  Workflow, 
  Network, 
  Users, 
  BarChart3,
  Scale,
  Users2,
  FileCheck,
  Shield,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  LucideIcon
} from "lucide-react";

export interface PillarModule {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  reportRoute?: string;
  isAvailable: boolean; // Se já está implementado
}

export interface Pillar {
  id: string;
  name: string;
  emoji: string;
  color: string; // HSL color
  bgColor: string; // Tailwind bg class
  description: string;
  isPrerequisite: boolean; // Se é obrigatório para desbloquear outros
  requiresPillar?: string; // Qual pilar precisa estar completo
  modules: PillarModule[];
  isHybrid?: boolean; // Se tem componente humano (mentoria)
}

export const PILLARS: Record<string, Pillar> = {
  essencia: {
    id: 'essencia',
    name: 'Essência',
    emoji: '🎯',
    color: 'hsl(var(--pillar-essencia))',
    bgColor: 'bg-pillar-essencia',
    description: 'Identidade, cultura e propósito da empresa',
    isPrerequisite: true,
    modules: [
      {
        id: 'mvv',
        name: 'Essência Máxima (MVV)',
        description: 'Missão, Visão e Valores',
        icon: Target,
        route: '/essencia/mvv',
        reportRoute: '/relatorio-mvv',
        isAvailable: true,
      },
      {
        id: 'anamnese',
        name: 'Anamnese Máxima',
        description: 'Diagnóstico Organizacional',
        icon: FileText,
        route: '/essencia/anamnese',
        reportRoute: '/relatorio-anamnese',
        isAvailable: true,
      },
      {
        id: 'cultura',
        name: 'Cultura Máxima',
        description: 'Código de Cultura',
        icon: Heart,
        route: '/essencia/cultura',
        reportRoute: '/relatorio-cultura',
        isAvailable: true,
      },
    ],
  },
  estrutura: {
    id: 'estrutura',
    name: 'Estrutura',
    emoji: '⚙️',
    color: 'hsl(var(--pillar-estrutura))',
    bgColor: 'bg-pillar-estrutura',
    description: 'Operações, processos e organização',
    isPrerequisite: false,
    requiresPillar: 'essencia',
    modules: [
      {
        id: 'valorChain',
        name: 'Cadeia de Valor Máxima',
        description: 'Mapeamento Estratégico',
        icon: TrendingUp,
        route: '/estrutura/cadeia-valor',
        reportRoute: '/relatorio-valor-cadeia',
        isAvailable: true,
      },
      {
        id: 'processos',
        name: 'Processos Máxima',
        description: 'Fluxos Detalhados',
        icon: Workflow,
        route: '/estrutura/processos',
        reportRoute: '/relatorio-processo',
        isAvailable: true,
      },
      {
        id: 'organograma',
        name: 'Organograma Máxima',
        description: 'Estrutura Organizacional',
        icon: Network,
        route: '/estrutura/organograma',
        isAvailable: false,
      },
      {
        id: 'funcoes',
        name: 'Funções Máxima',
        description: 'Descrição de Cargos',
        icon: Users,
        route: '/estrutura/funcoes',
        isAvailable: false,
      },
      {
        id: 'indicadores',
        name: 'Indicadores Máxima',
        description: 'Dashboard de KPIs',
        icon: BarChart3,
        route: '/estrutura/indicadores',
        isAvailable: false,
      },
    ],
  },
  governanca: {
    id: 'governanca',
    name: 'Governança',
    emoji: '⚖️',
    color: 'hsl(var(--pillar-governanca))',
    bgColor: 'bg-pillar-governanca',
    description: 'Acordos, regras e mecanismos de controle',
    isPrerequisite: false,
    requiresPillar: 'essencia',
    modules: [
      {
        id: 'acordoSocios',
        name: 'Acordo de Sócios',
        description: 'Pacto Societário',
        icon: Scale,
        route: '/governanca/acordo-socios',
        isAvailable: false,
      },
      {
        id: 'acordoFamiliar',
        name: 'Acordo Familiar',
        description: 'Protocolo Familiar',
        icon: Users2,
        route: '/governanca/acordo-familiar',
        isAvailable: false,
      },
      {
        id: 'codigoConduta',
        name: 'Código de Conduta',
        description: 'Ética e Compliance',
        icon: FileCheck,
        route: '/governanca/codigo-conduta',
        isAvailable: false,
      },
      {
        id: 'mecanismos',
        name: 'Mecanismos de Controle',
        description: 'Políticas e Processos',
        icon: Shield,
        route: '/governanca/mecanismos',
        isAvailable: false,
      },
    ],
  },
  conselho: {
    id: 'conselho',
    name: 'Conselho Consultivo',
    emoji: '👥',
    color: 'hsl(var(--pillar-conselho))',
    bgColor: 'bg-pillar-conselho',
    description: 'Suporte ao empresário, família e negócio',
    isPrerequisite: false,
    requiresPillar: 'essencia',
    isHybrid: true,
    modules: [
      {
        id: 'conselhoEmpresarial',
        name: 'Conselho Empresarial',
        description: 'Suporte Estratégico',
        icon: LayoutDashboard,
        route: '/conselho/empresarial',
        isAvailable: false,
      },
      {
        id: 'conselhoFamiliar',
        name: 'Conselho Familiar',
        description: 'Harmonia Familiar',
        icon: Users2,
        route: '/conselho/familiar',
        isAvailable: false,
      },
      {
        id: 'mentoria',
        name: 'Mentoria Executiva',
        description: 'Apoio ao Empresário',
        icon: MessageSquare,
        route: '/conselho/mentoria',
        isAvailable: false,
      },
      {
        id: 'agenda',
        name: 'Agenda de Reuniões',
        description: 'Calendário do Conselho',
        icon: Calendar,
        route: '/conselho/agenda',
        isAvailable: false,
      },
    ],
  },
};

// Helper para obter array de pilares
export const getPillarsArray = (): Pillar[] => Object.values(PILLARS);

// Helper para verificar se um pilar está desbloqueado
export const isPillarUnlocked = (
  pillarId: string, 
  essenciaComplete: boolean
): boolean => {
  const pillar = PILLARS[pillarId];
  if (!pillar) return false;
  
  // Essência sempre desbloqueado
  if (pillar.isPrerequisite) return true;
  
  // Outros pilares requerem Essência completa
  if (pillar.requiresPillar === 'essencia') {
    return essenciaComplete;
  }
  
  return true;
};

// Helper para calcular progresso de um pilar
export const getPillarProgress = (
  pillarId: string,
  completedModules: string[]
): { completed: number; total: number; percentage: number } => {
  const pillar = PILLARS[pillarId];
  if (!pillar) return { completed: 0, total: 0, percentage: 0 };
  
  const availableModules = pillar.modules.filter(m => m.isAvailable);
  const completed = availableModules.filter(m => completedModules.includes(m.id)).length;
  const total = availableModules.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

// Helper para obter status do pilar Essência
export const getEssenciaStatus = (
  mvvComplete: boolean,
  anamneseComplete: boolean,
  culturaComplete: boolean
): 'not_started' | 'in_progress' | 'complete' => {
  if (mvvComplete && culturaComplete) return 'complete';
  if (mvvComplete || anamneseComplete) return 'in_progress';
  return 'not_started';
};
