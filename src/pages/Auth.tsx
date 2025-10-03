import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingSession, setExistingSession] = useState<any>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [defaultTab, setDefaultTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    segment: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const initAuth = async () => {
      // Auto-redirect if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        navigate("/dashboard");
        return;
      }
      
      // Carregar leadData se existir
      const storedLeadData = sessionStorage.getItem("leadData");
      
      if (storedLeadData) {
        try {
          const parsed = JSON.parse(storedLeadData);
          setLeadData(parsed);
          setSignupData(prev => ({
            ...prev,
            name: parsed.name || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            company: parsed.company || "",
            segment: parsed.segment || "",
          }));
        } catch (error) {
          console.error("Erro ao recuperar dados do lead:", error);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        const isNewUser = sessionStorage.getItem("isNewSignup") === "true";
        
        if (isNewUser) {
          sessionStorage.removeItem("isNewSignup");
          navigate("/novo-mvv");
        } else {
          // Usuário existente: sempre vai pro dashboard
          // O dashboard vai detectar se tem MVV completo ou não
          navigate("/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleContinueAsUser = () => {
    navigate("/dashboard");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setExistingSession(null);
    setDefaultTab(leadData && leadData.email ? "signup" : "login");
    // Sem toast - experiência silenciosa
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Por favor, verifique as senhas digitadas.",
        variant: "destructive",
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      // Marcar como novo usuário e limpar dados do lead
      sessionStorage.setItem("isNewSignup", "true");
      sessionStorage.removeItem("leadData");

      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para sua consultoria...",
      });
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-8 flex items-center justify-center antialiased">
      <div className="w-full max-w-md space-y-8">
        <Link to="/" className="block">
          <img src={logo} alt="Máxima iA" className="h-12 md:h-14 w-auto mx-auto" />
        </Link>

        {existingSession && (
          <Alert className="bg-slate-800/50 border-slate-700/50">
            <User className="h-4 w-4" />
            <AlertDescription className="text-slate-300">
              Você está logado como <span className="font-semibold text-white">{existingSession.user.email}</span>
              {leadData && leadData.email !== existingSession.user.email && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ Este e-mail difere do que você preencheu no formulário
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {existingSession && (
          <div className="flex gap-3">
            <Button onClick={handleContinueAsUser} className="flex-1">
              Continuar como {existingSession.user.email.split('@')[0]}
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1">
              {leadData && leadData.email !== existingSession.user.email 
                ? "Sair e criar nova conta" 
                : "Sair e usar outro e-mail"}
            </Button>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    required
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    placeholder="+55 11 98765-4321"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-company">Empresa</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    required
                    value={signupData.company}
                    onChange={(e) => setSignupData({ ...signupData, company: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-segment">Segmento</Label>
                  <Input
                    id="signup-segment"
                    type="text"
                    required
                    value={signupData.segment}
                    onChange={(e) => setSignupData({ ...signupData, segment: e.target.value })}
                    placeholder="Ex: Tecnologia, Varejo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirmar senha</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    required
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    placeholder="Repita a senha"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar Conta Grátis"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-sm text-slate-300">
          <Link to="/" className="hover:text-white transition-colors">
            ← Voltar para o início
          </Link>
        </p>
      </div>
    </div>
  );
}