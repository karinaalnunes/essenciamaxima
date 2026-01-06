import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ShieldOff, Loader2, Search, UserCog } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  company?: string;
  isAdmin: boolean;
}

export function RolesManager() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name, company");

      if (profilesError) throw profilesError;

      // Load all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const usersWithRoles: UserWithRole[] = (profilesData || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        company: profile.company || undefined,
        isAdmin: adminIds.has(profile.id),
      }));

      // Sort: admins first, then alphabetically
      usersWithRoles.sort((a, b) => {
        if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) throw error;

      toast.success("Usuário promovido a administrador");
      loadUsers();
    } catch (error: any) {
      console.error("Error adding admin:", error);
      if (error.code === "23505") {
        toast.error("Usuário já é administrador");
      } else {
        toast.error("Erro ao adicionar admin");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast.success("Privilégios de admin removidos");
      loadUsers();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("Erro ao remover admin");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const adminCount = users.filter(u => u.isAdmin).length;

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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestão de Roles
          </h3>
          <p className="text-sm text-muted-foreground">
            Promova ou remova privilégios de administrador
          </p>
        </div>
        <Badge variant="secondary">
          {adminCount} admin{adminCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{user.name}</h4>
                  {user.isAdmin && (
                    <Badge variant="default" className="bg-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.company && (
                  <p className="text-xs text-muted-foreground truncate">{user.company}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {user.isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAdmin(user.id)}
                    disabled={actionLoading === user.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldOff className="h-4 w-4 mr-1" />
                        Remover Admin
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddAdmin(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-1" />
                        Tornar Admin
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
          </Card>
        )}
      </div>
    </div>
  );
}
