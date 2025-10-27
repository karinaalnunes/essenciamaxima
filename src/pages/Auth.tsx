import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { User } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [defaultTab, setDefaultTab] = useState(urlTab || "login");
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMethod, setResetMethod] = useState<"email" | "whatsapp" | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      // Setup auth listener FIRST - always redirect to dashboard
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && event === "SIGNED_IN") {
          navigate("/dashboard");
        }
      });

      // Check for existing session and auto-redirect
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        navigate("/dashboard");
        return subscription;
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
          // URL parameter takes priority over sessionStorage
          if (!urlTab) {
            setDefaultTab("signup");
          }
        } catch (error) {
          console.error("Erro ao recuperar dados do lead:", error);
        }
      }

      return subscription;
    };

    const subscription = initAuth();
    
    return () => {
      subscription.then(sub => sub?.unsubscribe());
    };
  }, [navigate]);

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

      // Limpar dados do lead
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

  const handlePasswordReset = async (method: "email" | "whatsapp") => {
    try {
      setLoading(true);
      setResetMethod(method);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", resetEmail)
        .single();

      if (method === "whatsapp") {
        const hasPhone = profile && 'phone' in profile && typeof profile.phone === 'string' && profile.phone;
        
        if (!hasPhone) {
          toast({
            title: "Telefone não cadastrado",
            description: "Use a recuperação por email.",
            variant: "destructive",
          });
          setResetMethod(null);
          return;
        }
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const { error: codeError } = await supabase.from("password_reset_codes").insert({
        email: resetEmail,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      if (codeError) throw codeError;

      if (method === "email") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f59e0b; margin-bottom: 24px;">Recuperação de Senha 🔐</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">Olá,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
              Você solicitou a recuperação de senha. Use o código abaixo:
            </p>
            <div style="background: #f3f4f6; padding: 24px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 24px 0;">
              ${code}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Código válido por 15 minutos.</p>
          </div>
        `;

        await supabase.functions.invoke("send-email", {
          body: {
            email: resetEmail,
            subject: "🔐 Código de Recuperação de Senha - Máxima iA",
            html: emailHtml,
            type: "password_reset",
          },
        });

        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada.",
        });
      } else if (profile && 'phone' in profile) {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: profile.phone,
            message: `Seu código de recuperação de senha da Máxima iA: ${code}\n\nVálido por 15 minutos.`,
            type: "password_reset",
          },
        });

        toast({
          title: "WhatsApp enviado!",
          description: "Verifique suas mensagens.",
        });
      }

      setShowCodeInput(true);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);

      const { data: validCode } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", resetEmail)
        .eq("code", resetCode)
        .gt("expires_at", new Date().toISOString())
        .is("used_at", null)
        .single();

      if (!validCode) {
        toast({
          title: "Código inválido ou expirado",
          variant: "destructive",
        });
        return;
      }

      setShowCodeInput(false);
      setShowNewPasswordForm(true);
    } catch (error: any) {
      toast({
        title: "Erro ao validar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Senhas não conferem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "Mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("reset_user_password_with_code", {
        user_email: resetEmail,
        reset_code: resetCode,
        new_password: newPassword,
      });

      if (error) throw error;

      const result = data as any;

      if (result?.success) {
        toast({
          title: "Senha atualizada!",
          description: "Faça login com sua nova senha.",
        });

        setShowForgotPassword(false);
        setShowNewPasswordForm(false);
        setResetEmail("");
        setResetCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        setResetMethod(null);
      } else {
        throw new Error(result?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
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
          <img src={logo} alt="Máxima iA" className="h-20 md:h-24 w-auto mx-auto" />
        </Link>

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

                <div className="text-center mt-2">
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setShowForgotPassword(true)}
                    type="button"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
                  
                  <div className="text-center mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      type="button"
                      onClick={async () => {
                        localStorage.clear();
                        await supabase.auth.signOut();
                        window.location.reload();
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Problemas para entrar? Limpar sessões
                    </Button>
                  </div>
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

      <AlertDialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogTitle className="text-white">
            Recuperar Senha
          </AlertDialogTitle>
          
          {!resetMethod && (
            <>
              <AlertDialogDescription className="text-slate-300">
                Digite seu email para recuperar a senha:
              </AlertDialogDescription>
              
              <Input
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-4"
              />
              
              <div className="mt-4 space-y-2">
                <Button 
                  onClick={() => handlePasswordReset("email")}
                  className="w-full"
                  disabled={!resetEmail || loading}
                >
                  📧 Enviar código por Email
                </Button>
                
                <Button 
                  onClick={() => handlePasswordReset("whatsapp")}
                  variant="outline"
                  className="w-full"
                  disabled={!resetEmail || loading}
                >
                  💬 Enviar código por WhatsApp
                </Button>
              </div>
            </>
          )}
          
          {showCodeInput && (
            <>
              <AlertDialogDescription className="text-slate-300">
                Digite o código de 6 dígitos recebido:
              </AlertDialogDescription>
              
              <div className="flex justify-center mt-4">
                <InputOTP maxLength={6} value={resetCode} onChange={setResetCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <Button onClick={handleVerifyCode} disabled={resetCode.length !== 6 || loading} className="mt-4">
                Verificar Código
              </Button>
            </>
          )}
          
          {showNewPasswordForm && (
            <>
              <AlertDialogDescription className="text-slate-300">
                Digite sua nova senha:
              </AlertDialogDescription>
              
              <div className="space-y-4 mt-4">
                <Input
                  type="password"
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                
                <Input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={newPassword.length < 6 || newPassword !== confirmNewPassword || loading}
                  className="w-full"
                >
                  Redefinir Senha
                </Button>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}