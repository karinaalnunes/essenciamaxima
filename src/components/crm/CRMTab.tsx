import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, List, BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CRMPipeline } from "./CRMPipeline";
import { CRMListView } from "./CRMListView";
import { CRMCompanyDetail } from "./CRMCompanyDetail";
import { CRMMetrics } from "./CRMMetrics";
import { CompanyCRM, PipelineStage } from "./types";

export function CRMTab() {
  const [companies, setCompanies] = useState<CompanyCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyCRM | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState<'kanban' | 'list' | 'metrics'>('kanban');

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch CRM records with joined MVV documents
      const { data: crmData, error: crmError } = await supabase
        .from('company_crm')
        .select('*')
        .order('updated_at', { ascending: false });

      if (crmError) throw crmError;

      if (!crmData || crmData.length === 0) {
        setCompanies([]);
        return;
      }

      // Get all MVV document IDs
      const mvvIds = crmData.map(c => c.mvv_document_id);

      // Fetch MVV documents
      const { data: mvvData, error: mvvError } = await supabase
        .from('mvv_documents')
        .select('id, user_id, title, company_name, segment, company_context, mission, mission_pocket, mission_punchline, vision, values, created_at, updated_at')
        .in('id', mvvIds);

      if (mvvError) throw mvvError;

      // Get user IDs from MVV documents
      const userIds = [...new Set(mvvData?.map(m => m.user_id) || [])];

      // Fetch profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, company')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Fetch anamnesis data
      const { data: anamnesisData, error: anamnesisError } = await supabase
        .from('organizational_anamnesis')
        .select('id, mvv_document_id, company_name, segment, main_frustrations, main_goal_12_months, vision_3_5_years, people_management_challenges, sales_challenges, innovation_readiness, status')
        .in('mvv_document_id', mvvIds);

      if (anamnesisError) throw anamnesisError;

      // Combine data
      const companiesWithDetails: CompanyCRM[] = crmData.map(crm => {
        const mvv = mvvData?.find(m => m.id === crm.mvv_document_id);
        const profile = mvv ? profileData?.find(p => p.id === mvv.user_id) : undefined;
        const anamnesis = anamnesisData?.find(a => a.mvv_document_id === crm.mvv_document_id);

        return {
          ...crm,
          mvv_document: mvv || undefined,
          profile: profile || undefined,
          anamnesis: anamnesis || undefined,
        } as CompanyCRM;
      });

      setCompanies(companiesWithDetails);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleStageChange = async (companyId: string, newStage: PipelineStage) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const oldStage = company.pipeline_stage;

    // Optimistic update
    setCompanies(prev => 
      prev.map(c => c.id === companyId ? { ...c, pipeline_stage: newStage } : c)
    );

    try {
      const { error } = await supabase
        .from('company_crm')
        .update({ 
          pipeline_stage: newStage,
          archived_at: newStage === 'arquivado' ? new Date().toISOString() : null
        })
        .eq('id', companyId);

      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('crm_activity_log').insert({
          crm_id: companyId,
          admin_id: user.id,
          action_type: 'stage_change',
          old_value: oldStage,
          new_value: newStage,
        });
      }

      toast.success(`Empresa movida para "${PIPELINE_STAGES_LABELS[newStage]}"`);
    } catch (error) {
      // Revert on error
      setCompanies(prev => 
        prev.map(c => c.id === companyId ? { ...c, pipeline_stage: oldStage } : c)
      );
      console.error('Error updating stage:', error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  const handleCompanyClick = (company: CompanyCRM) => {
    setSelectedCompany(company);
    setDetailOpen(true);
  };

  const handleSaveCompany = async (updates: Partial<CompanyCRM>) => {
    if (!selectedCompany) return;

    try {
      // Remove joined data before updating
      const { mvv_document, profile, anamnesis, ...cleanUpdates } = updates as any;
      
      const { error } = await supabase
        .from('company_crm')
        .update(cleanUpdates)
        .eq('id', selectedCompany.id);

      if (error) throw error;

      // Update local state
      setCompanies(prev => 
        prev.map(c => c.id === selectedCompany.id ? { ...c, ...updates } : c)
      );
      setSelectedCompany(prev => prev ? { ...prev, ...updates } : null);

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('crm_activity_log').insert({
          crm_id: selectedCompany.id,
          admin_id: user.id,
          action_type: 'status_update',
          notes: 'Dados atualizados via painel de detalhes',
        });
      }

      toast.success('Dados salvos com sucesso');
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Erro ao salvar dados');
      throw error;
    }
  };

  const PIPELINE_STAGES_LABELS: Record<PipelineStage, string> = {
    lead: 'Lead',
    essencia_andamento: 'Essência em Andamento',
    essencia_concluida: 'Essência Concluída',
    contato_qualificado: 'Contato Qualificado',
    proposta_aberta: 'Proposta em Aberto',
    cliente_ativo: 'Cliente Ativo',
    arquivado: 'Arquivados',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM Essência Máxima</h2>
          <p className="text-muted-foreground text-sm">
            {companies.length} empresa{companies.length !== 1 ? 's' : ''} no pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCompanies}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-1.5">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <CRMPipeline 
            companies={companies} 
            onStageChange={handleStageChange}
            onCompanyClick={handleCompanyClick}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <CRMListView 
            companies={companies}
            onCompanyClick={handleCompanyClick}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <CRMMetrics companies={companies} />
        </TabsContent>
      </Tabs>

      {/* Company Detail Sheet */}
      <CRMCompanyDetail
        company={selectedCompany}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSave={handleSaveCompany}
      />
    </div>
  );
}
