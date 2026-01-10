import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, User, Mail, Phone, GripVertical, Clock } from "lucide-react";
import { CompanyCRM, ACCESS_TYPES, PILLAR_STATUS_CONFIG, GOVERNANCE_STATUS_CONFIG, getEssenciaStatus } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { forwardRef } from "react";
import { formatDateBR, formatRelativeBR } from "@/lib/datetime";
interface CRMCompanyCardProps {
  company: CompanyCRM;
  onClick: () => void;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes?: Record<string, any>;
    listeners?: Record<string, any>;
  };
}

export const CRMCompanyCard = forwardRef<HTMLDivElement, CRMCompanyCardProps>(
  ({ company, onClick, isDragging, dragHandleProps }, ref) => {
    const mvv = company.mvv_document;
    const profile = company.profile;
    const accessType = ACCESS_TYPES.find(a => a.id === company.access_type);
    const essenciaStatus = getEssenciaStatus(mvv);
    const structureStatus = PILLAR_STATUS_CONFIG[company.pillar_structure_status];
    const governanceStatus = GOVERNANCE_STATUS_CONFIG[company.pillar_governance_status];

    // Check if company name is valid
    const hasValidCompanyName = mvv?.company_name && 
      mvv.company_name !== 'Em construção' && 
      mvv.company_name.trim() !== '' &&
      mvv.company_name.toLowerCase() !== 'a definir' &&
      mvv.company_name.toLowerCase() !== 'empresa';

    // Get person identifier with fallbacks - now using mvv_document.user_id if profile not loaded
    const getPersonIdentifier = () => {
      if (profile?.name && profile.name.trim()) {
        return { text: profile.name, icon: User };
      }
      if (profile?.email && profile.email.trim()) {
        return { text: profile.email, icon: Mail };
      }
      if (profile?.phone && profile.phone.trim()) {
        return { text: profile.phone, icon: Phone };
      }
      // Fallback: show partial user ID for debugging
      if (mvv?.user_id) {
        const shortId = mvv.user_id.slice(-6);
        return { text: `Carregando... (${shortId})`, icon: User };
      }
      return { text: 'Dados não carregados', icon: User };
    };

    const personInfo = getPersonIdentifier();

    // Determine display based on company name validity
    const primaryName = hasValidCompanyName ? mvv?.company_name : personInfo.text;
    const PrimaryIcon = hasValidCompanyName ? Building2 : personInfo.icon;
    
    // Secondary info
    const getSecondaryInfo = () => {
      if (hasValidCompanyName) {
        // Company is valid, show person as secondary
        return personInfo.text !== 'Lead sem contato' ? { text: personInfo.text, icon: personInfo.icon } : null;
      } else {
        // Company is invalid, show company status as secondary
        const companyStatus = mvv?.company_name === 'Em construção' 
          ? 'Empresa: Em construção' 
          : 'Empresa não informada';
        return { text: companyStatus, icon: Building2 };
      }
    };

    const secondaryInfo = getSecondaryInfo();

    const handleClick = (e: React.MouseEvent) => {
      // Don't trigger click if dragging
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick();
    };

    return (
      <Card 
        ref={ref}
        className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${isDragging ? 'opacity-50 rotate-2 scale-105 shadow-lg' : ''}`}
        onClick={handleClick}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {/* Drag Handle */}
                {dragHandleProps && (
                  <div 
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                    {...dragHandleProps.attributes}
                    {...dragHandleProps.listeners}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-4 w-4 flex-shrink-0" />
                  </div>
                )}
                <PrimaryIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h4 className="font-semibold text-sm truncate">
                  {primaryName}
                </h4>
              </div>
              {secondaryInfo && (
                <div className="flex items-center gap-1.5 mt-0.5 ml-5">
                  <secondaryInfo.icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {secondaryInfo.text}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge variant="outline" className="text-[10px]">
                {accessType?.icon} {accessType?.label}
              </Badge>
              {/* MVV Status Badge */}
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
                {essenciaStatus.emoji} MVV: {essenciaStatus.label}
              </Badge>
            </div>
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

          {/* Dates - Created & Updated */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-1" title={`Cadastro: ${formatDateBR(company.created_at)}`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDateBR(company.created_at)}</span>
            </div>
            <div className="flex items-center gap-1" title={`Última atualização: ${formatDateBR(company.updated_at)}`}>
              <Clock className="h-3 w-3" />
              <span>{formatRelativeBR(company.updated_at)}</span>
            </div>
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
);

CRMCompanyCard.displayName = 'CRMCompanyCard';
