import { Card, CardContent } from "@/components/ui/card";
import { Building2, User, Mail, Phone, GripVertical, MapPin, Calendar, Clock } from "lucide-react";
import { CompanyCRM, calculateOverallProgress } from "./types";
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
    const progress = calculateOverallProgress(company);

    // Check if company name is valid
    const hasValidCompanyName = mvv?.company_name && 
      mvv.company_name !== 'Em construção' && 
      mvv.company_name.trim() !== '' &&
      mvv.company_name.toLowerCase() !== 'a definir' &&
      mvv.company_name.toLowerCase() !== 'empresa';

    // Get person identifier with fallbacks
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
      if (mvv?.user_id) {
        const shortId = mvv.user_id.slice(-6);
        return { text: `Carregando... (${shortId})`, icon: User };
      }
      return { text: 'Dados não carregados', icon: User };
    };

    const personInfo = getPersonIdentifier();
    const primaryName = hasValidCompanyName ? mvv?.company_name : personInfo.text;
    const PrimaryIcon = hasValidCompanyName ? Building2 : personInfo.icon;
    
    // Secondary: show person when company is valid
    const secondaryName = hasValidCompanyName && personInfo.text !== 'Dados não carregados' 
      ? personInfo.text 
      : null;

    // Compact location string
    const location = [company.city, company.state].filter(Boolean).join(', ');

    const handleClick = (e: React.MouseEvent) => {
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
        <CardContent className="p-2.5 space-y-1.5">
          {/* Row 1: Drag + Name + Progress */}
          <div className="flex items-center gap-1.5">
            {dragHandleProps && (
              <div 
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
                {...dragHandleProps.attributes}
                {...dragHandleProps.listeners}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            )}
            <PrimaryIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate flex-1">{primaryName}</span>
            <span 
              className="text-[10px] font-mono tracking-tight flex-shrink-0" 
              title={`Progresso: ${progress.label} (${progress.level}/4 pilares)`}
            >
              {progress.dots}
            </span>
          </div>

          {/* Row 2: Secondary name (person) if applicable */}
          {secondaryName && (
            <div className="flex items-center gap-1.5 pl-5">
              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{secondaryName}</span>
            </div>
          )}

          {/* Row 3: Segment + Location */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-5">
            <span className="truncate">{mvv?.segment || 'Segmento'}</span>
            {location && (
              <>
                <span>•</span>
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </>
            )}
          </div>

          {/* Row 4: Compact dates */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/40 pl-5">
            <div className="flex items-center gap-0.5" title={`Cadastro: ${formatDateBR(company.created_at)}`}>
              <Calendar className="h-2.5 w-2.5" />
              <span>{formatDateBR(company.created_at)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-0.5" title={`Atualizado: ${formatDateBR(company.updated_at)}`}>
              <Clock className="h-2.5 w-2.5" />
              <span>{formatRelativeBR(company.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

CRMCompanyCard.displayName = 'CRMCompanyCard';
