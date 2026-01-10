import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, User, Mail, Phone, Target, Eye, Heart, Lightbulb, 
  AlertTriangle, TrendingUp, Calendar, Save, MessageSquare,
  CheckCircle2, Clock, FileText
} from "lucide-react";
import { 
  CompanyCRM, PIPELINE_STAGES, ACCESS_TYPES, NEXT_ACTIONS, 
  PILLAR_STATUS_CONFIG, GOVERNANCE_STATUS_CONFIG, getEssenciaStatus,
  PillarStatus, GovernanceStatus, PipelineStage
} from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CRMCompanyDetailProps {
  company: CompanyCRM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<CompanyCRM>) => Promise<void>;
}

export function CRMCompanyDetail({ company, open, onOpenChange, onSave }: CRMCompanyDetailProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<{
    pipeline_stage: PipelineStage;
    access_type: 'free_strategic' | 'paid' | 'paid_coupon' | 'admin';
    free_strategic_reason: string;
    pillar_structure_status: PillarStatus;
    pillar_governance_status: GovernanceStatus;
    admin_notes: string;
    next_action: string;
    next_action_date: string;
    city: string;
    state: string;
    partner_origin: string;
    coupon_used: string;
  }>({
    pipeline_stage: 'lead',
    access_type: 'free_strategic',
    free_strategic_reason: '',
    pillar_structure_status: 'na',
    pillar_governance_status: 'na',
    admin_notes: '',
    next_action: '',
    next_action_date: '',
    city: '',
    state: '',
    partner_origin: '',
    coupon_used: '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        pipeline_stage: company.pipeline_stage,
        access_type: company.access_type,
        free_strategic_reason: company.free_strategic_reason || '',
        pillar_structure_status: company.pillar_structure_status,
        pillar_governance_status: company.pillar_governance_status,
        admin_notes: company.admin_notes || '',
        next_action: company.next_action || '',
        next_action_date: company.next_action_date || '',
        city: company.city || '',
        state: company.state || '',
        partner_origin: company.partner_origin || '',
        coupon_used: company.coupon_used || '',
      });
    }
  }, [company]);

  if (!company) return null;

  const mvv = company.mvv_document;
  const profile = company.profile;
  const anamnesis = company.anamnesis;
  const essenciaStatus = getEssenciaStatus(mvv);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const renderValues = () => {
    if (!mvv?.values) return null;
    const values = Array.isArray(mvv.values) ? mvv.values : [];
    return values.map((v: any, i: number) => (
      <Badge key={i} variant="secondary" className="mr-1 mb-1">
        {typeof v === 'string' ? v : v.name || v.value || JSON.stringify(v)}
      </Badge>
    ));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5" />
                {mvv?.company_name || 'Empresa sem nome'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {mvv?.segment} • {essenciaStatus.emoji} {essenciaStatus.label}
              </p>
            </div>
            <Badge className={`${PIPELINE_STAGES.find(s => s.id === formData.pipeline_stage)?.color} bg-opacity-20`}>
              {PIPELINE_STAGES.find(s => s.id === formData.pipeline_stage)?.label}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="essencia" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="essencia">Essência</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="pilares">Pilares</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* Tab 1: Essência */}
          <TabsContent value="essencia" className="space-y-4 mt-4">
            {/* Contato */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.name || 'N/A'}</span>
                </div>
                {profile?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* História */}
            {mvv?.company_context && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> História
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {mvv.company_context}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* MVV */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" /> Missão, Visão e Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mvv?.mission ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">MISSÃO</p>
                    <p className="text-sm">{mvv.mission}</p>
                    {mvv.mission_punchline && (
                      <p className="text-xs text-primary mt-1 italic">"{mvv.mission_punchline}"</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Missão não definida</p>
                )}

                <Separator />

                {mvv?.vision ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">VISÃO</p>
                    <p className="text-sm">{mvv.vision}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Visão não definida</p>
                )}

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">VALORES</p>
                  <div className="flex flex-wrap">
                    {renderValues() || <span className="text-sm text-muted-foreground italic">Valores não definidos</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Anamnese */}
          <TabsContent value="anamnese" className="space-y-4 mt-4">
            {anamnesis ? (
              <>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Desafios e Frustrações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {anamnesis.main_frustrations && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">PRINCIPAIS FRUSTRAÇÕES</p>
                        <p className="text-muted-foreground">{anamnesis.main_frustrations}</p>
                      </div>
                    )}
                    {anamnesis.people_management_challenges && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">DESAFIOS DE GESTÃO DE PESSOAS</p>
                        <p className="text-muted-foreground">{anamnesis.people_management_challenges}</p>
                      </div>
                    )}
                    {anamnesis.sales_challenges && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">DESAFIOS DE VENDAS</p>
                        <p className="text-muted-foreground">{anamnesis.sales_challenges}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Objetivos e Visão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {anamnesis.main_goal_12_months && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">META 12 MESES</p>
                        <p className="text-muted-foreground">{anamnesis.main_goal_12_months}</p>
                      </div>
                    )}
                    {anamnesis.vision_3_5_years && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">VISÃO 3-5 ANOS</p>
                        <p className="text-muted-foreground">{anamnesis.vision_3_5_years}</p>
                      </div>
                    )}
                    {anamnesis.innovation_readiness && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">PRONTIDÃO PARA INOVAÇÃO</p>
                        <p className="text-muted-foreground">{anamnesis.innovation_readiness}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Anamnese não realizada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Pilares */}
          <TabsContent value="pilares" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Status por Pilar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Essência - readonly */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{essenciaStatus.emoji}</span>
                    <span className="font-medium">Pilar Essência</span>
                  </div>
                  <Badge variant="outline">{essenciaStatus.label}</Badge>
                </div>

                {/* Estrutura */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{PILLAR_STATUS_CONFIG[formData.pillar_structure_status].emoji}</span>
                    <span className="font-medium">Pilar Estrutura</span>
                  </div>
                  <Select 
                    value={formData.pillar_structure_status} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, pillar_structure_status: v as PillarStatus }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PILLAR_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.emoji} {config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Governança */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{GOVERNANCE_STATUS_CONFIG[formData.pillar_governance_status].emoji}</span>
                    <span className="font-medium">Pilar Governança</span>
                  </div>
                  <Select 
                    value={formData.pillar_governance_status} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, pillar_governance_status: v as GovernanceStatus }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOVERNANCE_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.emoji} {config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conselho */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚪</span>
                    <span className="font-medium">Pilar Conselho</span>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">Futuro</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Admin */}
          <TabsContent value="admin" className="space-y-4 mt-4">
            {/* Pipeline Stage & Access */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Etapa do Pipeline</Label>
                    <Select 
                      value={formData.pipeline_stage} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, pipeline_stage: v as PipelineStage }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Acesso</Label>
                    <Select 
                      value={formData.access_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, access_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_TYPES.map(access => (
                          <SelectItem key={access.id} value={access.id}>{access.icon} {access.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.access_type === 'free_strategic' && (
                  <div className="space-y-2">
                    <Label>Motivo do Free Estratégico</Label>
                    <Input
                      value={formData.free_strategic_reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, free_strategic_reason: e.target.value }))}
                      placeholder="Ex: Parceiro CAE, Bônus prometido..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parceiro de Origem</Label>
                    <Input
                      value={formData.partner_origin}
                      onChange={(e) => setFormData(prev => ({ ...prev, partner_origin: e.target.value }))}
                      placeholder="CAE, Direto..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cupom Utilizado</Label>
                    <Input
                      value={formData.coupon_used}
                      onChange={(e) => setFormData(prev => ({ ...prev, coupon_used: e.target.value }))}
                      placeholder="CUPOM20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Action */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Próxima Ação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ação</Label>
                    <Select 
                      value={formData.next_action} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, next_action: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma ação" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEXT_ACTIONS.map(action => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.next_action_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_action_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Notas do Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Percepção emocional, contexto político/familiar, estratégia de abordagem..."
                  rows={5}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Criado: {format(new Date(company.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
              <span>
                Atualizado: {format(new Date(company.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
