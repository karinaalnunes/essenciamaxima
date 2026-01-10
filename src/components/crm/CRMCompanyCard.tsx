import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, User } from "lucide-react";
import { CompanyCRM, ACCESS_TYPES, PILLAR_STATUS_CONFIG, GOVERNANCE_STATUS_CONFIG, getEssenciaStatus } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CRMCompanyCardProps {
  company: CompanyCRM;
  onClick: () => void;
  isDragging?: boolean;
}

export function CRMCompanyCard({ company, onClick, isDragging }: CRMCompanyCardProps) {
  const mvv = company.mvv_document;
  const profile = company.profile;
  const accessType = ACCESS_TYPES.find(a => a.id === company.access_type);
  const essenciaStatus = getEssenciaStatus(mvv);
  const structureStatus = PILLAR_STATUS_CONFIG[company.pillar_structure_status];
  const governanceStatus = GOVERNANCE_STATUS_CONFIG[company.pillar_governance_status];

  // Check if company name is valid
  const hasValidCompanyName = mvv?.company_name && 
    mvv.company_name !== 'Em construção' && 
    mvv.company_name.trim() !== '';

  // Determine primary and secondary display names
  const primaryName = hasValidCompanyName ? mvv?.company_name : (profile?.name || 'Usuário sem nome');
  const secondaryName = hasValidCompanyName ? profile?.name : null;
  const PrimaryIcon = hasValidCompanyName ? Building2 : User;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <PrimaryIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h4 className="font-semibold text-sm truncate">
                {primaryName}
              </h4>
            </div>
            {secondaryName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {secondaryName}
                </span>
              </div>
            )}
            {/* MVV Status Badge */}
            <div className="flex items-center gap-1.5 mt-1">
              <Badge 
                variant={essenciaStatus.status === 'completed' ? 'default' : 'secondary'}
                className={`text-[10px] ${
                  essenciaStatus.status === 'completed' 
                    ? 'bg-green-500/20 text-green-700 border-green-500/30' 
                    : essenciaStatus.status === 'in_progress'
                    ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {essenciaStatus.emoji} {essenciaStatus.label}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            {accessType?.icon} {accessType?.label}
          </Badge>
        </div>

        {/* Segment & Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{mvv?.segment || 'Segmento não definido'}</span>
          {(company.city || company.state) && (
            <>
              <span>•</span>
              <span className="truncate">
                {[company.city, company.state].filter(Boolean).join(', ')}
              </span>
            </>
          )}
        </div>

        {/* Pillar Status */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
          <span className="text-[10px] font-medium flex items-center gap-1" title="Essência">
            {essenciaStatus.emoji} Essência
          </span>
          <span className="text-[10px] font-medium flex items-center gap-1" title="Estrutura">
            {structureStatus.emoji} Estrutura
          </span>
          <span className="text-[10px] font-medium flex items-center gap-1" title="Governança">
            {governanceStatus.emoji} Governança
          </span>
          <span className="text-[10px] font-medium flex items-center gap-1" title="Conselho">
            ⚪ Conselho
          </span>
        </div>

        {/* Next Action */}
        {company.next_action && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
            <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
            <span className="text-[10px] text-primary font-medium truncate">
              {company.next_action}
              {company.next_action_date && (
                <span className="text-muted-foreground ml-1">
                  ({format(new Date(company.next_action_date), "dd/MM", { locale: ptBR })})
                </span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
