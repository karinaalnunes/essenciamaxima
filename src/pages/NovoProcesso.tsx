import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "@/components/VoiceInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageFormatter } from "@/components/MessageFormatter";
import { FeedbackForm } from "@/components/FeedbackForm";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function NovoProcesso() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Check authentication and initialize
  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Check for existing document or create new one
      const { data: existingDoc } = await supabase
        .from("process_documents" as any)
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "mapping")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingDoc) {
        const doc = existingDoc as any;
        setDocumentId(doc.id);
        if (doc.conversation_history && Array.isArray(doc.conversation_history)) {
          setMessages(doc.conversation_history as Message[]);
        } else {
          await initializeConversation(doc.id);
        }
      } else {
        await createNewDocument(session.user.id);
      }

      setIsInitializing(false);
    };

    initializeSession();
  }, [navigate]);

  const createNewDocument = async (uid: string) => {
    const { data, error } = await supabase
      .from("process_documents" as any)
      .insert({
        user_id: uid,
        status: "mapping",
        conversation_history: []
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      toast.error("Erro ao iniciar sessão");
      return;
    }

    const doc = data as any;
    setDocumentId(doc.id);
    await initializeConversation(doc.id);
  };

  const initializeConversation = async (docId: string) => {
    const initialMessages: Message[] = [
      {
        role: "assistant",
        content: "Olá! 👋 Sou o **Processos Máxima 2.0**, seu assistente especializado em mapear processos internos.\n\nVou te ajudar a documentar seus processos de forma clara e profissional, transformando conhecimento tácito em material replicável.\n\n**Antes de começar, me diga:**\n\nEsse processo que você quer mapear faz parte de uma **função estruturada** da empresa (um cargo fixo) ou é uma **atividade pontual/projeto específico**?"
      }
    ];

    setMessages(initialMessages);

    await supabase
      .from("process_documents" as any)
      .update({ conversation_history: initialMessages })
      .eq("id", docId);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isUserScrolling && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isUserScrolling]);

  // Detect user scrolling
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsUserScrolling(!isAtBottom);
    }
  };

  // Show feedback form after some interaction
  useEffect(() => {
    if (messages.length >= 6 && !showFeedback && !readyToGenerate) {
      const timer = setTimeout(() => setShowFeedback(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, showFeedback, readyToGenerate]);

  const handleTranscription = async (transcription: string) => {
    if (!documentId) return;

    // Check if user wants to generate report
    const generateTriggers = ['gerar relatório', 'gerar relatorio', 'ver relatório', 'ver relatorio', 'criar relatório', 'criar relatorio'];
    if (generateTriggers.some(trigger => transcription.toLowerCase().includes(trigger))) {
      await handleGenerateReport();
      return;
    }

    const userMessage: Message = { role: "user", content: transcription };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Save user message
      await supabase
        .from("process_documents" as any)
        .update({ conversation_history: updatedMessages })
        .eq("id", documentId);

      // Call process-chat edge function
      const { data, error } = await supabase.functions.invoke("process-chat", {
        body: {
          messages: updatedMessages,
          functionContext: null, // Will be enhanced in Phase 2 with Funções Máxima
          hasFunctionDescriptor: false
        }
      });

      if (error) throw error;

      // Handle streaming response
      const reader = data.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      const tempMessage: Message = { role: "assistant", content: "" };
      setMessages([...updatedMessages, tempMessage]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              assistantMessage += content;

              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage
                };
                return newMessages;
              });
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }

      // Save complete conversation
      const finalMessages = [...updatedMessages, { role: "assistant", content: assistantMessage }];
      await supabase
        .from("process_documents" as any)
        .update({ conversation_history: finalMessages })
        .eq("id", documentId);

      // Check if ready to generate
      if (assistantMessage.toLowerCase().includes('gerar relatório') || 
          assistantMessage.toLowerCase().includes('gerar o relatório')) {
        setReadyToGenerate(true);
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Erro ao processar mensagem");
      setMessages(updatedMessages); // Remove temporary assistant message
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!documentId) return;

    setIsGenerating(true);
    toast.info("Gerando relatório completo... Isso pode levar até 1 minuto.");

    try {
      // Get complete conversation
      const { data: doc } = await supabase
        .from("process_documents" as any)
        .select("*")
        .eq("id", documentId)
        .single();

      if (!doc) throw new Error("Documento não encontrado");

      // Generate report
      const { data, error } = await supabase.functions.invoke("generate-process-report", {
        body: {
          conversationHistory: (doc as any).conversation_history,
          functionContext: (doc as any).function_description || null
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao gerar relatório");
      }

      // Save to database
      await supabase
        .from("process_documents" as any)
        .update({
          function_name: data.data.function_name,
          function_description: data.data.function_description,
          has_function_descriptor: data.data.has_function_descriptor,
          processes: data.data.processes,
          status: "completed"
        })
        .eq("id", documentId);

      toast.success("Relatório gerado com sucesso!");
      navigate(`/relatorio-processo/${documentId}`);

    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-400" />
          <p className="text-slate-300">Iniciando Processos Máxima 2.0...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-white">Processos Máxima 2.0</h1>
          <div className="w-24" />
        </div>

        {/* Chat Area */}
        <ScrollArea
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[calc(100vh-280px)] mb-6 rounded-lg border border-slate-700 bg-slate-900/50 p-6"
        >
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <MessageFormatter content={message.content} role={message.role} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-100 rounded-lg p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="space-y-4">
          <VoiceInput
            onTranscription={handleTranscription}
            disabled={isLoading || isGenerating}
          />

          {readyToGenerate && (
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-gradient-cta hover:shadow-xl"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando Relatório...
                </>
              ) : (
                "📋 Ver Meu Relatório de Processos"
              )}
            </Button>
          )}

          {showFeedback && !readyToGenerate && documentId && (
            <FeedbackForm 
              documentId={documentId} 
              onSubmit={() => setShowFeedback(false)} 
            />
          )}
        </div>
      </div>

      {/* Generation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-8 rounded-lg border border-purple-500 max-w-md text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-purple-400" />
            <h3 className="text-xl font-bold text-white">Gerando Relatório Completo</h3>
            <p className="text-slate-300">
              Estou estruturando todos os processos mapeados em um documento profissional.
              Aguarde...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
