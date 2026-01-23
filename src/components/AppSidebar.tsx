import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronRight, 
  Home, 
  User, 
  Lock, 
  Trophy,
  Settings,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PILLARS, getPillarsArray, isPillarUnlocked, getPillarProgress } from "@/config/pillars";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import logoIcon from "@/assets/logo-maxima-ia-light.png";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  isAdmin?: boolean;
  essenciaComplete?: boolean;
  completedModules?: string[];
}

export function AppSidebar({ 
  isAdmin = false, 
  essenciaComplete = false,
  completedModules = []
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    essencia: true,
    estrutura: false,
    governanca: false,
    conselho: false,
  });

  const pillars = getPillarsArray();
  const currentPath = location.pathname;

  // Auto-expand the pillar containing the current route
  useEffect(() => {
    pillars.forEach(pillar => {
      const isInPillar = pillar.modules.some(m => 
        currentPath.startsWith(m.route) || 
        (m.reportRoute && currentPath.startsWith(m.reportRoute))
      );
      if (isInPillar) {
        setExpandedPillars(prev => ({ ...prev, [pillar.id]: true }));
      }
    });
  }, [currentPath]);

  const togglePillar = (pillarId: string) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  const isActiveRoute = (route: string, reportRoute?: string) => {
    return currentPath === route || (reportRoute && currentPath.startsWith(reportRoute));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <img 
            src={collapsed ? logoIcon : logo} 
            alt="Máxima iA" 
            className={cn(
              "transition-all duration-200 object-contain",
              collapsed ? "w-10 h-10" : "h-10 w-auto max-w-[160px]"
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Dashboard Link */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/dashboard")}
                isActive={currentPath === "/dashboard"}
                tooltip="Dashboard"
              >
                <Home className="h-4 w-4" />
                {!collapsed && <span>Dashboard</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Pillars */}
        {pillars.map((pillar) => {
          const isUnlocked = isPillarUnlocked(pillar.id, essenciaComplete);
          const progress = getPillarProgress(pillar.id, completedModules);
          const isExpanded = expandedPillars[pillar.id];
          
          return (
            <SidebarGroup key={pillar.id} className="py-1">
              <SidebarGroupLabel 
                className={cn(
                  "flex items-center justify-between cursor-pointer px-2 py-2 rounded-md transition-colors",
                  !isUnlocked && "opacity-50",
                  isExpanded && "bg-secondary/50"
                )}
                onClick={() => isUnlocked && togglePillar(pillar.id)}
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const PillarIcon = pillar.icon;
                    return <PillarIcon className="h-4 w-4 text-primary/70" />;
                  })()}
                  {!collapsed && (
                    <span className="font-medium text-sm">{pillar.name}</span>
                  )}
                  {!isUnlocked && !collapsed && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                {!collapsed && isUnlocked && (
                  <div className="flex items-center gap-2">
                    {progress.total > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {progress.completed}/{progress.total}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
              </SidebarGroupLabel>

              {isExpanded && isUnlocked && !collapsed && (
                <SidebarGroupContent className="mt-1">
                  {/* Progress bar */}
                  {progress.total > 0 && (
                    <div className="px-2 mb-2">
                      <Progress 
                        value={progress.percentage} 
                        className="h-1"
                      />
                    </div>
                  )}
                  
                  <SidebarMenu>
                    {pillar.modules.map((module) => {
                      const isActive = isActiveRoute(module.route, module.reportRoute);
                      const isCompleted = completedModules.includes(module.id);
                      const ModuleIcon = module.icon;
                      
                      return (
                        <SidebarMenuItem key={module.id}>
                          <SidebarMenuButton
                            onClick={() => module.isAvailable && navigate(module.route)}
                            isActive={isActive}
                            disabled={!module.isAvailable}
                            className={cn(
                              "pl-8",
                              !module.isAvailable && "opacity-50 cursor-not-allowed",
                              isCompleted && "text-primary"
                            )}
                            tooltip={module.name}
                          >
                            <ModuleIcon className="h-4 w-4" />
                            <span className="truncate">{module.name}</span>
                            {isCompleted && (
                              <span className="ml-auto text-primary">✓</span>
                            )}
                            {!module.isAvailable && (
                              <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}

        {/* Quick Links */}
        <SidebarGroup className="mt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/vitorias")}
                isActive={currentPath === "/vitorias"}
                tooltip="Vitórias"
              >
                <Trophy className="h-4 w-4" />
                {!collapsed && <span>Minhas Vitórias</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate("/perfil")}
                isActive={currentPath === "/perfil"}
                tooltip="Perfil"
              >
                <User className="h-4 w-4" />
                {!collapsed && <span>Perfil & Kanban</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/admin")}
                  isActive={currentPath === "/admin"}
                  tooltip="Admin"
                >
                  <Settings className="h-4 w-4" />
                  {!collapsed && <span>Admin</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Sair"
              className="text-destructive hover:text-destructive/80"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
