import { Lock, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  locked?: boolean;
}

export const ModuleCard = ({ title, description, icon: Icon, locked = true }: ModuleCardProps) => {
  return (
    <Card className={`relative overflow-hidden transition-all hover:border-primary/50 ${locked ? 'opacity-90' : ''}`}>
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
      </CardContent>
    </Card>
  );
};
