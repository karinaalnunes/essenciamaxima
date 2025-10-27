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

  const mvvComplete = documents.mvv?.mission && documents.mvv?.vision;
  const cultureComplete = documents.culture?.cultural_essence;

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
                {profile.company && (
                  <Badge variant="secondary">{profile.company}</Badge>
                )}
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
        </div>

        {/* Upcoming Meetings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Próximas Reuniões</h3>
            </div>
          </div>
          <MeetingsList 
            meetings={meetings} 
            onRefresh={() => loadData(viewingUserId || profile.id)}
            maxItems={3}
          />
        </Card>

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
