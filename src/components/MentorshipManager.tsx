import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCheck, UserX, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  mentor_name?: string;
}

export function MentorshipManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, name, company");

      // Load users with admin role (mentors)
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = adminRoles?.map(r => r.user_id) || [];
      
      const mentorsList = profilesData?.filter(p => adminIds.includes(p.id)) || [];
      const usersList = profilesData?.filter(p => !adminIds.includes(p.id)) || [];

      // Load existing mentorships
      const { data: mentorshipsData } = await supabase
        .from("mentorship_relationships")
        .select("*, profiles!mentorship_relationships_mentor_id_fkey(name)");

      const mentorshipsWithNames = mentorshipsData?.map(m => ({
        ...m,
        mentor_name: (m.profiles as any)?.name,
      })) || [];

      setUsers(usersList);
      setMentors(mentorsList);
      setMentorships(mentorshipsWithNames);

      // Initialize assignments
      const initialAssignments: Record<string, string> = {};
      mentorshipsWithNames.forEach(m => {
        if (m.status === "active") {
          initialAssignments[m.mentee_id] = m.mentor_id;
        }
      });
      setAssignments(initialAssignments);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (menteeId: string, mentorId: string) => {
    try {
      // Check if relationship exists
      const existing = mentorships.find(m => m.mentee_id === menteeId);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("mentorship_relationships")
          .update({ mentor_id: mentorId, status: "active" })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("mentorship_relationships")
          .insert({ mentor_id: mentorId, mentee_id: menteeId, status: "active" });

        if (error) throw error;
      }

      toast.success("Mentor atribuído com sucesso");
      loadData();
    } catch (error) {
      console.error("Error assigning mentor:", error);
      toast.error("Erro ao atribuir mentor");
    }
  };

  const handleRemove = async (menteeId: string) => {
    try {
      const existing = mentorships.find(m => m.mentee_id === menteeId && m.status === "active");
      if (!existing) return;

      const { error } = await supabase
        .from("mentorship_relationships")
        .update({ status: "paused" })
        .eq("id", existing.id);

      if (error) throw error;

      toast.success("Mentor removido");
      loadData();
    } catch (error) {
      console.error("Error removing mentor:", error);
      toast.error("Erro ao remover mentor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Mentoria</h3>
          <p className="text-sm text-muted-foreground">
            Atribua consultores para acompanhar clientes
          </p>
        </div>
        <Badge variant="secondary">
          {Object.keys(assignments).length} atribuições ativas
        </Badge>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const currentMentor = assignments[user.id];
          const mentorship = mentorships.find(m => m.mentee_id === user.id && m.status === "active");

          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.company && (
                    <p className="text-xs text-muted-foreground">{user.company}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {mentorship && (
                    <Badge variant="outline">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {mentorship.mentor_name}
                    </Badge>
                  )}

                  <Select
                    value={currentMentor || ""}
                    onValueChange={(value) => handleAssign(user.id, value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Atribuir consultor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map((mentor) => (
                        <SelectItem key={mentor.id} value={mentor.id}>
                          {mentor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {currentMentor && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(user.id)}
                    >
                      <UserX className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {users.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhum cliente encontrado
          </Card>
        )}
      </div>
    </div>
  );
}
