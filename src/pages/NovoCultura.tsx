import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import logo from "@/assets/logo-maxima-ia-negativo.png";
import { VoiceInput } from "@/components/VoiceInput";
import { MessageFormatter } from "@/components/MessageFormatter";
import { FeedbackForm } from "@/components/FeedbackForm";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NovoCultura() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [mvvDocument, setMvvDocument] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const [conversationStartTime] = useState<number>(Date.now());
  const [conversationMetricId, setConversationMetricId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeDocument = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      // Buscar MVV completo do usuário
      const { data: mvvDocs } = await supabase
        .from("mvv_documents")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!mvvDocs || mvvDocs.length === 0 || !mvvDocs[0].mission || !mvvDocs[0].vision) {
        toast({
          title: "MVV não encontrado",
          description: "Você precisa completar seu MVV antes de criar o Código de Cultura.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setMvvDocument(mvvDocs[0]);

      // Verificar se já existe um documento de cultura
      const { data: cultureDocs } = await supabase
        .from("culture_documents")
        .select("*")
        .eq("user_id", uid)
        .eq("mvv_document_id", mvvDocs[0].id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cultureDocs && cultureDocs.length > 0) {
        const cultureDoc = cultureDocs[0];
        setDocumentId(cultureDoc.id);
        await loadExistingConversation(cultureDoc.id);
      } else {
        await initializeConversation(uid, mvvDocs[0]);
      }

      setLoading(false);
    };

    initializeDocument();
  }, [navigate, toast]);

  // Função de scroll reutilizável
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  };

  useEffect(() => {
    if (userScrolled) return;
    
    // Delay para garantir que o DOM foi atualizado
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, userScrolled]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isAtBottom) {
        setUserScrolled(false);
      } else if (scrollTop < scrollHeight - clientHeight - 100) {
        setUserScrolled(true);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (readyToGenerate && !showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [readyToGenerate, showFeedback]);

  const loadExistingConversation = async (cultureDocId: string) => {
    const { data: history } = await supabase
      .from("culture_conversation_history")
      .select("*")
      .eq("culture_document_id", cultureDocId)
      .order("created_at", { ascending: true });

    // If a doc exists but has no history (e.g. after reset), start fresh using the prompt-based opening
    if (!history || history.length === 0) {
      setReadyToGenerate(false);
      setShowFeedback(false);
      await initializeNewConversation(cultureDocId);
      return;
    }

    const loadedMessages: Message[] = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
    setMessages(loadedMessages);

    const lastMessage = history[history.length - 1];
    if (lastMessage?.content?.includes("[PRONTO_PARA_GERAR]")) {
      setReadyToGenerate(true);
    }
  };

  const initializeConversation = async (uid: string, mvvDoc: any) => {
    const { data: newDoc, error } = await supabase
      .from("culture_documents")
      .insert({
        user_id: uid,
        mvv_document_id: mvvDoc.id,
        title: `Código de Cultura - ${mvvDoc.company_name}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar documento de cultura:", error);
      toast({
        title: "Erro",
        description: "Erro ao inicializar a consultoria. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setDocumentId(newDoc.id);
    await initializeNewConversation(newDoc.id);
  };

  const initializeNewConversation = async (docId: string) => {
    // Request initial message from AI using the prompt from database
    setReadyToGenerate(false);
    setShowFeedback(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/culture-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: "Olá, estou pronto para começar.",
            conversationHistory: [],
            documentId: docId,
            mvvData: mvvDocument
              ? {
                  company_name: mvvDocument.company_name,
                  segment: mvvDocument.segment,
                  vision: mvvDocument.vision,
                  mission: mvvDocument.mission,
                  values: mvvDocument.values,
                }
              : null,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get initial message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";

      setMessages([{ role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.content || parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages([{ role: "assistant", content: assistantMessage }]);
            }
          } catch {
            // Incomplete JSON split across chunks: put it back and wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (!assistantMessage.trim()) {
        throw new Error("Empty initial assistant message");
      }

      await supabase.from("culture_conversation_history").insert({
        culture_document_id: docId,
        role: "assistant",
        content: assistantMessage,
      });
    } catch (error) {
      console.error("Error getting initial message:", error);

      const fallbackMessage: Message = {
        role: "assistant",
        content:
          "Olá! Sou o Código de Cultura Máxima, consultor especializado em transformar seu MVV em cultura viva. Vamos começar?",
      };

      setMessages([fallbackMessage]);

      await supabase.from("culture_conversation_history").insert({
        culture_document_id: docId,
        role: "assistant",
        content: fallbackMessage.content,
      });
    }
  };

  const handleResetConversation = async () => {
    if (!documentId) return;
    if (isResetting) return;

    setIsResetting(true);
    setReadyToGenerate(false);
    setShowFeedback(false);

    try {
      const { error: deleteError } = await supabase
        .from("culture_conversation_history")
        .delete()
        .eq("culture_document_id", documentId);

      if (deleteError) throw deleteError;

      // Clear any generated report fields so the session is really "fresh"
      await supabase
        .from("culture_documents")
        .update({
          reputation_goal: null,
          competitive_advantage: null,
          swot_strengths: null,
          swot_improvements: null,
          guiding_principles: null,
          growth_practices: null,
          wellbeing_support: null,
          psychological_safety_practices: null,
          cultural_rituals: null,
          stakeholder_guidelines: null,
          culture_indicators: null,
          action_plan_30: null,
          action_plan_60: null,
          action_plan_90: null,
          action_plan_120: null,
          cultural_essence: null,
          cultural_strengths: null,
          cultural_challenges: null,
          strategic_focus: null,
          closing_message: null,
        })
        .eq("id", documentId);

      await initializeNewConversation(documentId);

      toast({
        title: "Conversa reiniciada",
        description: "O robô foi reiniciado e já puxou o prompt atualizado.",
      });
    } catch (error) {
      console.error("Erro ao reiniciar conversa:", error);
      toast({
        title: "Erro",
        description: "Não consegui reiniciar agora. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleTranscription = async (text: string) => {

    if (!userId || !documentId || !mvvDocument) return;
    if (isSending) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setUserScrolled(false);
    
    // Scroll imediato após enviar mensagem
    scrollToBottom();

    // Timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Fetch fresh conversation history from database to avoid stale state
      const { data: freshHistory, error: historyError } = await supabase
        .from('culture_conversation_history')
        .select('role, content')
        .eq('culture_document_id', documentId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching fresh history:', historyError);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/culture-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: text,
            conversationHistory: freshHistory || [],
            documentId,
            mvvData: {
              company_name: mvvDocument.company_name,
              segment: mvvDocument.segment,
              vision: mvvDocument.vision,
              mission: mvvDocument.mission,
              values: mvvDocument.values,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessage = "";

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      // Stream inactivity timeout (30 seconds) - safe (no throw outside the main try/catch)
      let streamTimedOut = false;
      let inactivityTimeoutId: ReturnType<typeof setTimeout> | undefined;
      const resetInactivityTimeout = () => {
        if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
        inactivityTimeoutId = setTimeout(() => {
          streamTimedOut = true;
          try { reader.cancel(); } catch { /* ignore */ }
        }, 30000);
      };
      resetInactivityTimeout();

      try {
        while (true) {
          if (streamTimedOut) throw new Error("Stream timeout");

          const { done, value } = await reader.read();
          if (streamTimedOut) throw new Error("Stream timeout");
          if (done) break;

          resetInactivityTimeout();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: assistantMessage,
                    };
                    return updated;
                  });
                  
                  // Scroll durante streaming se usuário não rolou manualmente
                  if (!userScrolled) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
      }

      if (assistantMessage.includes("[PRONTO_PARA_GERAR]")) {
        setReadyToGenerate(true);
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      const isTimeout = error?.name === "AbortError";
      toast({
        title: isTimeout ? "Tempo esgotado" : "Erro",
        description: isTimeout
          ? "O servidor demorou muito. Tente novamente."
          : "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      // Remove placeholder message on error
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1]?.role === "assistant" && !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      clearTimeout(timeoutId);
      setIsSending(false);
    }
  };

  const handleGenerateCulture = async () => {
    if (!documentId || !mvvDocument) return;
    
    setIsGenerating(true);

    try {
      const { data: history } = await supabase
        .from("culture_conversation_history")
        .select("*")
        .eq("culture_document_id", documentId)
        .order("created_at", { ascending: true });

      if (!history) throw new Error("Histórico não encontrado");

      const conversationText = history
        .map((msg) => `${msg.role === "user" ? "Usuário" : "Consultor"}: ${msg.content}`)
        .join("\n\n");

      const { data: cultureData, error: generateError } = await supabase.functions.invoke(
        "generate-culture-report",
        {
          body: {
            conversationHistory: conversationText,
            mvvData: {
              company_name: mvvDocument.company_name,
              segment: mvvDocument.segment,
              company_size: mvvDocument.company_size,
              vision: mvvDocument.vision,
              mission: mvvDocument.mission,
              values: mvvDocument.values,
              company_context: mvvDocument.company_context,
            },
          },
        }
      );

      if (generateError) throw generateError;

      const { error: updateError } = await supabase
        .from("culture_documents")
        .update({
          reputation_goal: cultureData.reputation_goal,
          competitive_advantage: cultureData.competitive_advantage,
          swot_strengths: cultureData.swot_strengths,
          swot_improvements: cultureData.swot_improvements,
          guiding_principles: cultureData.guiding_principles,
          growth_practices: cultureData.growth_practices,
          wellbeing_support: cultureData.wellbeing_support,
          psychological_safety_practices: cultureData.psychological_safety_practices,
          cultural_rituals: cultureData.cultural_rituals,
          stakeholder_guidelines: cultureData.stakeholder_guidelines,
          culture_indicators: cultureData.culture_indicators,
          action_plan_30: cultureData.action_plan_30,
          action_plan_60: cultureData.action_plan_60,
          action_plan_90: cultureData.action_plan_90,
          action_plan_120: cultureData.action_plan_120,
          cultural_essence: cultureData.cultural_essence,
          cultural_strengths: cultureData.cultural_strengths,
          cultural_challenges: cultureData.cultural_challenges,
          strategic_focus: cultureData.strategic_focus,
          closing_message: cultureData.closing_message,
        })
        .eq("id", documentId);

      if (updateError) throw updateError;

      // Enviar notificação de relatório pronto
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.functions.invoke("send-report-notification", {
          body: {
            userId: user.id,
            reportType: "cultura",
            reportId: documentId,
            companyName: mvvDocument.company_name,
          },
        });
      }

      toast({
        title: "Sucesso! 🎉",
        description: "Código de Cultura gerado com sucesso!",
      });

      navigate(`/relatorio-cultura/${documentId}`);
    } catch (error) {
      console.error("Erro ao gerar cultura:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
          <p className="text-white">Inicializando consultoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-hero flex flex-col antialiased overflow-x-hidden">
      {/* Header - Compact on mobile */}
      <header className="p-3 md:p-6 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white px-2 md:px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
          <img src={logo} alt="Máxima iA" width="150" height="75" />
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-sm md:text-xl font-bold text-white hidden sm:block">
            💜 Cultura Máxima
          </h1>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isResetting || loading}
                className="text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reiniciar o robô?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga o histórico desta conversa e inicia novamente usando o prompt ativo da área de Prompts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetConversation} disabled={isResetting}>
                  {isResetting ? "Reiniciando..." : "Reiniciar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Chat area - More space on mobile */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 md:p-6">
        <div className="max-w-3xl mx-auto space-y-3 md:space-y-6 pb-32">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-3 md:p-4 break-words [overflow-wrap:anywhere] ${
                  message.role === "user"
                    ? "bg-slate-700/50 text-white"
                    : "bg-slate-800/50 text-slate-100"
                }`}
              >
                <MessageFormatter content={message.content} role={message.role} />
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 rounded-2xl p-3 md:p-4">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-slate-400" />
              </div>
            </div>
          )}

          {showFeedback && readyToGenerate && documentId && (
            <div className="mt-4 md:mt-8 p-4 md:p-6 bg-slate-800/70 rounded-xl border border-green-500/30">
              <FeedbackForm documentId={documentId} onSubmit={() => {}} />
              <Button
                onClick={handleGenerateCulture}
                className="w-full mt-3 md:mt-4"
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Ver Meu Código de Cultura 🎯"
                )}
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area - Compact on mobile */}
      {!readyToGenerate && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-3 md:p-6">
          <div className="max-w-3xl mx-auto">
            <VoiceInput
              onTranscription={handleTranscription}
              disabled={isSending || isGenerating}
            />
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl text-center space-y-3 md:space-y-4 max-w-md mx-4">
            <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin text-purple-400 mx-auto" />
            <h3 className="text-lg md:text-xl font-bold text-white">
              Gerando seu Código de Cultura...
            </h3>
            <p className="text-sm md:text-base text-slate-300">
              Isso pode levar alguns segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
