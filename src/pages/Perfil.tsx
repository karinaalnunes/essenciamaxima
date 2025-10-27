import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { MeetingsList } from "@/components/MeetingsList";
import { TasksStatusChart } from "@/components/TasksStatusChart";
import { TasksTimelineChart } from "@/components/TasksTimelineChart";
import { toast } from "sonner";
import { 
  Edit, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Globe, 
  FileText, 
  Calendar,
  Loader2,
  ArrowLeft
} from "lucide-react";
import confetti from "canvas-confetti";

// Helper function to generate mock data
const generateMockData = () => {
  const now = new Date();
  const mockTasks = [
    // Concluídas (8)
    { id: '1', title: 'Definir valores organizacionais', status: 'done', priority: 'high', source_type: 'mvv_report', due_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', title: 'Revisar missão e visão', status: 'done', priority: 'high', source_type: 'mvv_report', due_date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', title: 'Mapear stakeholders', status: 'done', priority: 'medium', source_type: 'culture_report', plan_period: '30', due_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '4', title: 'Criar código de ética', status: 'done', priority: 'high', source_type: 'culture_report', plan_period: '30', due_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '5', title: 'Implementar feedback 360', status: 'done', priority: 'medium', source_type: 'culture_report', plan_period: '60', due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '6', title: 'Onboarding cultural', status: 'done', priority: 'medium', source_type: 'manual', due_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '7', title: 'Workshop de valores', status: 'done', priority: 'high', source_type: 'meeting', due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '8', title: 'Comunicação interna MVV', status: 'done', priority: 'high', source_type: 'mvv_report', due_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    
    // Em progresso (4)
    { id: '9', title: 'Desenvolver programa de mentoria', status: 'in_progress', priority: 'high', source_type: 'culture_report', plan_period: '60', due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '10', title: 'Sistema de reconhecimento', status: 'in_progress', priority: 'medium', source_type: 'culture_report', plan_period: '60', due_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '11', title: 'Pesquisa de clima', status: 'in_progress', priority: 'high', source_type: 'meeting', due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '12', title: 'Treinamento de liderança', status: 'in_progress', priority: 'medium', source_type: 'manual', due_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString() },
    
    // A fazer (5)
    { id: '13', title: 'Implementar rituais culturais', status: 'todo', priority: 'high', source_type: 'culture_report', plan_period: '90', due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '14', title: 'Comitê de cultura', status: 'todo', priority: 'medium', source_type: 'culture_report', plan_period: '90', due_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '15', title: 'Dashboard de indicadores', status: 'todo', priority: 'high', source_type: 'manual', due_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '16', title: 'Evento de integração', status: 'todo', priority: 'low', source_type: 'meeting', due_date: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '17', title: 'Revisão anual MVV', status: 'todo', priority: 'medium', source_type: 'mvv_report', due_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() },
    
    // Backlog (3)
    { id: '18', title: 'Plano de sucessão', status: 'backlog', priority: 'medium', source_type: 'culture_report', plan_period: '120', due_date: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '19', title: 'Programa de diversidade', status: 'backlog', priority: 'high', source_type: 'manual', due_date: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '20', title: 'Certificação Great Place', status: 'backlog', priority: 'low', source_type: 'meeting', due_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString() },
    
    // Atrasadas (2)
    { id: '21', title: 'Atualizar manual do colaborador', status: 'todo', priority: 'high', source_type: 'manual', due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '22', title: 'Reunião de alinhamento estratégico', status: 'in_progress', priority: 'high', source_type: 'meeting', due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const mockMeetings = [
    { id: '1', title: 'Reunião de Mentoria', scheduled_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), meeting_type: 'mentoring', status: 'scheduled' },
    { id: '2', title: 'Follow-up Cultura Máxima', scheduled_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), meeting_type: 'follow_up', status: 'scheduled' },
    { id: '3', title: 'Revisão Trimestral', scheduled_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), meeting_type: 'follow_up', status: 'scheduled' },
  ];

  return { tasks: mockTasks, meetings: mockMeetings };
};

export default function Perfil() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get("user");
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [documents, setDocuments] = useState({ mvv: null, culture: null });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [viewingUserId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const targetUserId = viewingUserId || user.id;
    setIsOwnProfile(targetUserId === user.id);

    // Check if current user is a mentor
    if (viewingUserId) {
      const { data: mentorship } = await supabase
        .from("mentorship_relationships")
        .select("*")
        .eq("mentor_id", user.id)
        .eq("mentee_id", viewingUserId)
        .eq("status", "active")
        .single();

      setIsMentor(!!mentorship);
    }

    loadData(targetUserId);
  };

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      // Load tasks
      const { data: tasksData } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);

      // Load meetings
      const { data: meetingsData } = await supabase
        .from("meetings")
        .select("*")
        .eq("user_id", userId)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });

      setMeetings(meetingsData || []);

      // Load documents
      const { data: mvvDoc } = await supabase
        .from("mvv_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: cultureDoc } = await supabase
        .from("culture_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setDocuments({ mvv: mvvDoc, culture: cultureDoc });
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("user_tasks")
      .update({ 
        status: newStatus,
        completed_at: newStatus === "done" ? new Date().toISOString() : null
      })
      .eq("id", taskId);

    if (error) {
      toast.error("Erro ao mover tarefa");
      return;
    }

    if (newStatus === "done") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("Tarefa concluída! 🎉");
    }

    loadData(viewingUserId || profile.id);
  };

  const handleTaskEdit = async (task: any) => {
    const { error } = await supabase
      .from("user_tasks")
      .update(task)
      .eq("id", task.id);

    if (error) {
      toast.error("Erro ao atualizar tarefa");
      return;
    }

    toast.success("Tarefa atualizada");
    loadData(viewingUserId || profile.id);
  };

  const handleTaskDelete = async (taskId: string) => {
    const { error } = await supabase
      .from("user_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      toast.error("Erro ao excluir tarefa");
      return;
    }

    toast.success("Tarefa excluída");
    loadData(viewingUserId || profile.id);
  };

  const handleTaskCreate = async (task: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const targetUserId = viewingUserId || user.id;

    const { error } = await supabase
      .from("user_tasks")
      .insert({
        ...task,
        user_id: targetUserId,
      });

    if (error) {
      toast.error("Erro ao criar tarefa");
      return;
    }

    toast.success("Tarefa criada");
    loadData(targetUserId);
  };

  const handleProfileSave = async (updatedProfile: any) => {
    const { error } = await supabase
      .from("profiles")
      .update(updatedProfile)
      .eq("id", profile.id);

    if (error) {
      toast.error("Erro ao atualizar perfil");
      return;
    }

    toast.success("Perfil atualizado");
    setProfile({ ...profile, ...updatedProfile });
  };

  const handleLoadMockData = () => {
    const mockData = generateMockData();
    setTasks(mockData.tasks);
    setMeetings(mockData.meetings);
    toast.success("Dados simulados carregados para demonstração");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Perfil não encontrado</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPlanBadge = (plan: string) => {
    const planConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: string }> = {
      trial: { label: "Trial", variant: "secondary", icon: "🆓" },
      essencia_basica: { label: "Essência Básica", variant: "default", icon: "⭐" },
      essencia_completa: { label: "Essência Completa", variant: "default", icon: "✨" },
      acompanhamento_grupo: { label: "Acompanhamento em Grupo", variant: "default", icon: "👥" },
      acompanhamento_individual: { label: "Acompanhamento Individual", variant: "default", icon: "💎" },
      consultoria_completa: { label: "Consultoria Completa", variant: "default", icon: "🏆" },
    };
    return planConfig[plan] || planConfig.trial;
  };

  const mvvComplete = documents.mvv?.mission && documents.mvv?.vision;
  const cultureComplete = documents.culture?.cultural_essence;
  const isPaidPlan = profile?.subscription_plan && profile.subscription_plan !== 'trial';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {viewingUserId && (
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {isOwnProfile ? "Meu Perfil" : `Perfil de ${profile.name}`}
            </h1>
            {isMentor && (
              <p className="text-muted-foreground">Visualizando como mentor</p>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                {profile.position && (
                  <p className="text-muted-foreground">{profile.position}</p>
                )}
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.company && (
                    <Badge variant="secondary">{profile.company}</Badge>
                  )}
                  {profile.subscription_plan && (() => {
                    const planBadge = getPlanBadge(profile.subscription_plan);
                    return (
                      <Badge variant={planBadge.variant}>
                        {planBadge.icon} {planBadge.label}
                      </Badge>
                    );
                  })()}
                </div>
                {profile.bio && (
                  <p className="text-sm mt-2 max-w-2xl">{profile.bio}</p>
                )}

                {/* Social Links */}
                <div className="flex gap-2 mt-4">
                  {profile.linkedin_personal && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={profile.linkedin_personal} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.instagram_personal && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`https://instagram.com/${profile.instagram_personal.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.facebook_personal && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={profile.facebook_personal} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.company_website && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={profile.company_website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>
        </Card>

        {/* Documents Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Essência Máxima (MVV)</h3>
                  <p className="text-sm text-muted-foreground">
                    {mvvComplete ? "Documento completo" : "Em andamento"}
                  </p>
                </div>
              </div>
              {mvvComplete && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/relatorio-mvv/${documents.mvv.id}`)}
                >
                  Ver Relatório
                </Button>
              )}
            </div>
          </Card>

          {isPaidPlan ? (
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Cultura Máxima</h3>
                    <p className="text-sm text-muted-foreground">
                      {cultureComplete ? "Documento completo" : "Em andamento"}
                    </p>
                  </div>
                </div>
                {cultureComplete && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/relatorio-cultura/${documents.culture.id}`)}
                  >
                    Ver Relatório
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-4 relative opacity-60">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
                <div className="text-center p-4">
                  <p className="text-sm font-semibold">🔒 Disponível nos planos pagos</p>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Cultura Máxima</h3>
                    <p className="text-sm text-muted-foreground">Código de Cultura Completo</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Upcoming Meetings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Próximas Reuniões</h3>
            </div>
            {isMentor && (
              <Button variant="outline" size="sm" onClick={handleLoadMockData}>
                📊 Carregar Dados Simulados
              </Button>
            )}
          </div>
          <MeetingsList 
            meetings={meetings} 
            onRefresh={() => loadData(viewingUserId || profile.id)}
            maxItems={3}
          />
        </Card>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksStatusChart tasks={tasks} />
          <TasksTimelineChart tasks={tasks} days={30} />
        </div>

        {/* Kanban Board */}
        <Card className="p-6">
          <KanbanBoard
            tasks={tasks}
            onTaskMove={handleTaskMove}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onTaskCreate={handleTaskCreate}
          />
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleProfileSave}
          profile={profile}
        />
      )}
    </div>
  );
}
