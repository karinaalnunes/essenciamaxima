import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [essenciaComplete, setEssenciaComplete] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Check admin status
      const { data: hasAdminRole } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      setIsAdmin(!!hasAdminRole);

      // Load user's completed modules
      const completed: string[] = [];

      // Check MVV
      const { data: mvvDocs } = await supabase
        .from("mvv_documents")
        .select("mission, vision, values")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (mvvDocs && mvvDocs[0]?.mission && mvvDocs[0]?.vision && mvvDocs[0]?.values) {
        completed.push("mvv");
      }

      // Check Anamnese
      const { data: anamnesisDocs } = await supabase
        .from("organizational_anamnesis")
        .select("completed_at")
        .eq("user_id", session.user.id)
        .not("completed_at", "is", null)
        .limit(1);

      if (anamnesisDocs && anamnesisDocs.length > 0) {
        completed.push("anamnese");
      }

      // Check Culture
      const { data: cultureDocs } = await supabase
        .from("culture_documents")
        .select("cultural_essence, guiding_principles")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cultureDocs && cultureDocs[0]?.cultural_essence) {
        completed.push("cultura");
      }

      // Check Value Chain
      const { data: valueChainDocs } = await supabase
        .from("value_chain_documents")
        .select("status, activities")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (valueChainDocs && valueChainDocs[0]?.status === "completed") {
        completed.push("valorChain");
      }

      // Check Process
      const { data: processDocs } = await supabase
        .from("process_documents")
        .select("status")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (processDocs && processDocs[0]?.status === "completed") {
        completed.push("processos");
      }

      setCompletedModules(completed);
      
      // Essência is complete if MVV and Cultura are done
      const essenciaIsDone = completed.includes("mvv") && completed.includes("cultura");
      setEssenciaComplete(essenciaIsDone);

      setLoading(false);
    };

    checkAuthAndLoadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          isAdmin={isAdmin}
          essenciaComplete={essenciaComplete}
          completedModules={completedModules}
        />
        <SidebarInset className="flex-1">
          <header className="flex h-14 items-center gap-4 border-b border-border/50 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
