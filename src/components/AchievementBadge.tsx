import { Trophy, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  emoji: string;
  name: string;
  status: 'complete' | 'in-progress' | 'locked';
  color?: string;
}

export const AchievementBadge = ({ emoji, name, status, color }: AchievementBadgeProps) => {
  const statusConfig = {
    complete: {
      icon: Trophy,
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/50',
      textColor: 'text-emerald-400',
      iconColor: 'text-emerald-400',
      label: 'Concluído'
    },
    'in-progress': {
      icon: Clock,
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      textColor: 'text-yellow-400',
      iconColor: 'text-yellow-400',
      label: 'Em andamento'
    },
    locked: {
      icon: Lock,
      bgColor: 'bg-slate-700/30',
      borderColor: 'border-slate-600/30',
      textColor: 'text-slate-500',
      iconColor: 'text-slate-500',
      label: 'Bloqueado'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all",
        config.bgColor,
        config.borderColor,
        status === 'complete' && "hover:scale-105 cursor-pointer"
      )}
    >
      <div className="text-4xl mb-2 relative">
        {emoji}
        {status !== 'locked' && (
          <div className="absolute -top-1 -right-1">
            <Icon className={cn("w-5 h-5", config.iconColor)} />
          </div>
        )}
      </div>
      <p className={cn("text-sm font-medium text-center mb-1", config.textColor)}>
        {name}
      </p>
      <span className={cn("text-xs", config.textColor)}>
        {config.label}
      </span>
    </div>
  );
};
