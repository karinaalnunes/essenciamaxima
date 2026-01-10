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
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h4 className="font-semibold text-sm truncate">
                {mvv?.company_name || 'Empresa sem nome'}
              </h4>
            </div>
            {profile && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {profile.name}
                </span>
              </div>
            )}
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
