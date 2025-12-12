import { Lock, LucideIcon, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ModuleCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  locked?: boolean;
  status?: 'none' | 'incomplete' | 'complete';
  onClick?: () => void;
}

export const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  locked = true,
  status,
  onClick
}: ModuleCardProps) => {
  const isClickable = !locked && onClick;
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:border-primary/50 ${locked ? 'opacity-90' : ''} ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      {locked && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
          <Lock className="w-8 h-8 text-slate-400/70" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-slate-400">{description || "Em breve"}</p>
        
        {locked && (
          <Badge variant="secondary" className="mt-3">
            🔒 Disponível em breve
          </Badge>
        )}
        
        {!locked && status === 'none' && (
          <Button size="sm" className="mt-3 w-full">
            Iniciar Módulo
          </Button>
        )}
        
        {!locked && status === 'incomplete' && (
          <Badge variant="outline" className="mt-3 border-yellow-500/50 text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Em andamento
          </Badge>
        )}
        
        {!locked && status === 'complete' && (
          <Badge variant="outline" className="mt-3 border-green-500/50 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completo - Ver Relatório
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
