import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2 } from "lucide-react";
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

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || userScrolled) return;

    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
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

    if (history && history.length > 0) {
      const loadedMessages: Message[] = history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      setMessages(loadedMessages);

      const lastMessage = history[history.length - 1];
      if (lastMessage?.content?.includes("[PRONTO_PARA_GERAR]")) {
        setReadyToGenerate(true);
      }
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
    const initialMessages: Message[] = [
      {
        role: "assistant",
        content: "Olá! 👋 Sou o Robô 8, consultor de Cultura Organizacional da Máxima IA.\n\nVou te guiar na criação do **Código de Cultura Máxima** da sua empresa, expandindo o trabalho que você já fez com o MVV.\n\nVamos estruturar juntos os 7 pilares da cultura organizacional: Identidade, Princípios, Desenvolvimento de Pessoas, Rituais, Relacionamento, Indicadores e Plano de Ação.\n\nPronto para começar? 🚀",
      },
    ];

    setMessages(initialMessages);

    setTimeout(async () => {
      const msg2: Message = {
        role: "assistant",
        content: "**Etapa 1/7: Identidade e Diferenciação** 🎯\n\nVamos começar pela identidade da sua empresa.\n\n**Quando alguém falar da sua empresa daqui a alguns anos, pelo que você gostaria de ser reconhecido?**",
      };
      
      setMessages((prev) => [...prev, msg2]);

      await supabase.from("culture_conversation_history").insert({
        culture_document_id: docId,
        role: "assistant",
        content: initialMessages[0].content,
      });

      await supabase.from("culture_conversation_history").insert({
        culture_document_id: docId,
        role: "assistant",
        content: msg2.content,
      });
    }, 2000);
  };

  const handleTranscription = async (text: string) => {
    if (!userId || !documentId || !mvvDocument) return;
    if (isSending) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setUserScrolled(false);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke("culture-chat", {
        body: {
          message: text,
          conversationHistory,
          documentId,
          mvvData: {
            company_name: mvvDocument.company_name,
            segment: mvvDocument.segment,
            vision: mvvDocument.vision,
            mission: mvvDocument.mission,
            values: mvvDocument.values,
          },
        },
      });

      if (error) throw error;

      const reader = data?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessage = "";

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.content;
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
              }
            } catch (e) {
              console.error("Erro ao fazer parse do SSE:", e);
            }
          }
        }
      }

      if (assistantMessage.includes("[PRONTO_PARA_GERAR]")) {
        setReadyToGenerate(true);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
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
    <div className="min-h-screen bg-gradient-hero flex flex-col antialiased">
      <header className="p-6 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <img src={logo} alt="Máxima iA" className="h-12 w-auto" />
        </div>
        <h1 className="text-xl font-bold text-white hidden md:block">
          💜 Cultura Máxima - Código de Cultura Completo
        </h1>
      </header>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6 pb-32">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
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
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            </div>
          )}

          {showFeedback && readyToGenerate && documentId && (
            <div className="mt-8 p-6 bg-slate-800/70 rounded-xl border border-green-500/30">
              <FeedbackForm documentId={documentId} onSubmit={() => {}} />
              <Button
                onClick={handleGenerateCulture}
                className="w-full mt-4"
                size="lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Relatório...
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

      {!readyToGenerate && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-6">
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
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center space-y-4 max-w-md">
            <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">
              Gerando seu Código de Cultura...
            </h3>
            <p className="text-slate-300">
              Estamos estruturando todos os pilares da sua cultura organizacional.
              Isso pode levar alguns segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
