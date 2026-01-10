export interface CompanyCRM {
  id: string;
  mvv_document_id: string;
  pipeline_stage: PipelineStage;
  access_type: AccessType;
  free_strategic_reason: string | null;
  pillar_structure_status: PillarStatus;
  pillar_governance_status: GovernanceStatus;
  pillar_council_status: string;
  admin_notes: string | null;
  evolution_hypothesis: EvolutionHypothesis;
  next_action: string | null;
  next_action_date: string | null;
  city: string | null;
  state: string | null;
  coupon_used: string | null;
  partner_origin: string | null;
  contacted_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  mvv_document?: MVVDocumentSummary;
  profile?: ProfileSummary;
  anamnesis?: AnamnesisSummary;
}

export interface MVVDocumentSummary {
  id: string;
  user_id: string;
  title: string;
  company_name: string;
  segment: string;
  company_context: string | null;
  mission: string | null;
  mission_pocket: string | null;
  mission_punchline: string | null;
  vision: string | null;
  values: any;
  created_at: string;
  updated_at: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export interface AnamnesisSummary {
  id: string;
  company_name: string;
  segment: string;
  main_frustrations: string | null;
  main_goal_12_months: string | null;
  vision_3_5_years: string | null;
  people_management_challenges: string | null;
  sales_challenges: string | null;
  innovation_readiness: string | null;
  status: string | null;
}

export type PipelineStage = 
  | 'lead'
  | 'essencia_andamento'
  | 'essencia_concluida'
  | 'contato_qualificado'
  | 'proposta_aberta'
  | 'cliente_ativo'
  | 'arquivado';

export type AccessType = 'free_strategic' | 'paid' | 'paid_coupon' | 'admin';

export type PillarStatus = 'na' | 'recommended' | 'contracted' | 'in_progress' | 'completed';

export type GovernanceStatus = 'na' | 'alert' | 'talking' | 'contracted';

export interface EvolutionHypothesis {
  structure?: string;
  governance?: string;
  council?: string;
  notes?: string;
}

export interface CRMActivityLog {
  id: string;
  crm_id: string;
  admin_id: string;
  action_type: 'stage_change' | 'note_added' | 'contact_made' | 'proposal_sent' | 'status_update' | 'action_set';
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  created_at: string;
}

export const PIPELINE_STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'essencia_andamento', label: 'Essência em Andamento', color: 'bg-yellow-500' },
  { id: 'essencia_concluida', label: 'Essência Concluída', color: 'bg-green-500' },
  { id: 'contato_qualificado', label: 'Contato Qualificado', color: 'bg-blue-500' },
  { id: 'proposta_aberta', label: 'Proposta em Aberto', color: 'bg-purple-500' },
  { id: 'cliente_ativo', label: 'Cliente Ativo', color: 'bg-emerald-600' },
  { id: 'arquivado', label: 'Arquivados', color: 'bg-gray-400' },
];

export const ACCESS_TYPES: { id: AccessType; label: string; icon: string }[] = [
  { id: 'free_strategic', label: 'Free Estratégico', icon: '🎁' },
  { id: 'paid', label: 'Pago', icon: '💳' },
  { id: 'paid_coupon', label: 'Pago c/ Cupom', icon: '🎟️' },
  { id: 'admin', label: 'Admin', icon: '👑' },
];

export const PILLAR_STATUS_CONFIG = {
  na: { label: 'N/A', color: 'bg-gray-300', emoji: '⚪' },
  recommended: { label: 'Recomendado', color: 'bg-yellow-400', emoji: '🟡' },
  contracted: { label: 'Contratado', color: 'bg-green-500', emoji: '🟢' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500', emoji: '🔵' },
  completed: { label: 'Concluído', color: 'bg-emerald-600', emoji: '✅' },
};

export const GOVERNANCE_STATUS_CONFIG = {
  na: { label: 'N/A', color: 'bg-gray-300', emoji: '⚪' },
  alert: { label: 'Alerta', color: 'bg-red-500', emoji: '🔴' },
  talking: { label: 'Em Conversa', color: 'bg-yellow-400', emoji: '🟡' },
  contracted: { label: 'Contratado', color: 'bg-green-500', emoji: '🟢' },
};

export const NEXT_ACTIONS = [
  'Entrar em contato',
  'Agendar reunião',
  'Convidar para Pilar Estrutura',
  'Convidar para Governança',
  'Enviar proposta',
  'Acompanhar',
  'Aguardar retorno',
  'Arquivar',
];

export function getEssenciaStatus(mvv: MVVDocumentSummary | undefined): { status: 'not_started' | 'in_progress' | 'completed'; emoji: string; label: string } {
  if (!mvv) {
    return { status: 'not_started', emoji: '🔴', label: 'Não iniciado' };
  }
  if (mvv.mission && mvv.vision) {
    return { status: 'completed', emoji: '🟢', label: 'Concluído' };
  }
  if (mvv.mission || mvv.vision || mvv.company_context) {
    return { status: 'in_progress', emoji: '🟡', label: 'Em andamento' };
  }
  return { status: 'not_started', emoji: '🔴', label: 'Não iniciado' };
}
