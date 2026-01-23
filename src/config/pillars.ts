import {
  Compass,
  Building2,
  Shield,
  Users,
  FileText,
  Heart,
  ClipboardList,
  GitBranch,
  Network,
  UserCog,
  BarChart3,
  Handshake,
  Home,
  BookOpen,
  Calendar,
  MessageCircle,
  Briefcase,
  LucideIcon,
} from "lucide-react";

export interface PillarModule {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  route: string;
  reportRoute?: string;
  isAvailable: boolean;
}

export interface Pillar {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  isPrerequisite: boolean;
  requiresPillar?: string;
  modules: PillarModule[];
  isHybrid?: boolean;
}

export const PILLARS: Record<string, Pillar> = {
  essencia: {
    id: "essencia",
    name: "Essência",
    icon: Compass,
    description: "Identidade, cultura e propósito da empresa",
    isPrerequisite: true,
    modules: [
      {
        id: "mvv",
        name: "MVV",
        description: "Missão, Visão e Valores",
        icon: FileText,
        route: "/essencia/mvv",
        reportRoute: "/essencia/mvv/relatorio",
        isAvailable: true,
      },
      {
        id: "anamnese",
        name: "Anamnese",
        description: "Diagnóstico organizacional",
        icon: ClipboardList,
        route: "/essencia/anamnese",
        reportRoute: "/essencia/anamnese/relatorio",
        isAvailable: true,
      },
      {
        id: "cultura",
        name: "Cultura",
        description: "Código de cultura organizacional",
        icon: Heart,
        route: "/essencia/cultura",
        reportRoute: "/essencia/cultura/relatorio",
        isAvailable: true,
      },
    ],
  },
  estrutura: {
    id: "estrutura",
    name: "Estrutura",
    icon: Building2,
    description: "Operações, processos e organização",
    requiresPillar: "essencia",
    isPrerequisite: false,
    modules: [
      {
        id: "valorChain",
        name: "Cadeia de Valor",
        description: "Mapeamento da cadeia de valor",
        icon: GitBranch,
        route: "/estrutura/cadeia-valor",
        reportRoute: "/estrutura/cadeia-valor/relatorio",
        isAvailable: true,
      },
      {
        id: "processos",
        name: "Processos",
        description: "Documentação de processos",
        icon: Network,
        route: "/estrutura/processos",
        reportRoute: "/estrutura/processos/relatorio",
        isAvailable: true,
      },
      {
        id: "organograma",
        name: "Organograma",
        description: "Estrutura organizacional",
        icon: Users,
        route: "/estrutura/organograma",
        isAvailable: false,
      },
      {
        id: "funcoes",
        name: "Funções",
        description: "Descrição de cargos e funções",
        icon: UserCog,
        route: "/estrutura/funcoes",
        isAvailable: false,
      },
      {
        id: "indicadores",
        name: "Indicadores",
        description: "KPIs e métricas de desempenho",
        icon: BarChart3,
        route: "/estrutura/indicadores",
        isAvailable: false,
      },
    ],
  },
  governanca: {
    id: "governanca",
    name: "Governança",
    icon: Shield,
    description: "Acordos, regras e mecanismos de controle",
    requiresPillar: "essencia",
    isPrerequisite: false,
    modules: [
      {
        id: "acordoSocios",
        name: "Acordo de Sócios",
        description: "Pacto societário",
        icon: Handshake,
        route: "/governanca/acordo-socios",
        isAvailable: false,
      },
      {
        id: "acordoFamiliar",
        name: "Acordo Familiar",
        description: "Protocolo familiar",
        icon: Home,
        route: "/governanca/acordo-familiar",
        isAvailable: false,
      },
      {
        id: "codigoConduta",
        name: "Código de Conduta",
        description: "Normas de comportamento",
        icon: BookOpen,
        route: "/governanca/codigo-conduta",
        isAvailable: false,
      },
    ],
  },
  conselho: {
    id: "conselho",
    name: "Conselho",
    icon: Users,
    description: "Suporte ao empresário, família e negócio",
    requiresPillar: "essencia",
    isPrerequisite: false,
    isHybrid: true,
    modules: [
      {
        id: "agenda",
        name: "Agenda",
        description: "Agendamento de reuniões",
        icon: Calendar,
        route: "/conselho/agenda",
        isAvailable: false,
      },
      {
        id: "mentoria",
        name: "Mentoria",
        description: "Sessões de mentoria",
        icon: MessageCircle,
        route: "/conselho/mentoria",
        isAvailable: false,
      },
      {
        id: "painel",
        name: "Painel",
        description: "Painel do conselheiro",
        icon: Briefcase,
        route: "/conselho/painel",
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
