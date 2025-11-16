import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "@/components/VoiceInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NovoValorCadeia() {
  const navigate = useNavigate();
  const [hasAnamnesis, setHasAnamnesis] = useState(false);
  const [isCheckingPrerequisite, setIsCheckingPrerequisite] = useState(true);
  const [anamnesisData, setAnamnesisData] = useState<any>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkPrerequisites = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // CRITICAL: Check for completed Anamnese
        const { data: anamnesis } = await supabase
          .from("organizational_anamnesis")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "completed")
          .maybeSingle();

        if (!anamnesis) {
          setHasAnamnesis(false);
          setIsCheckingPrerequisite(false);
          return;
        }

        setHasAnamnesis(true);
        setAnamnesisData(anamnesis);

        // Check for existing document or create new one
        const { data: existingDoc } = await supabase
          .from("value_chain_documents" as any)
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
          await createNewDocument(session.user.id, anamnesis.id);
        }

        setIsCheckingPrerequisite(false);
      } catch (error) {
        console.error("Error checking prerequisites:", error);
        toast.error("Erro ao verificar pré-requisitos");
        setIsCheckingPrerequisite(false);
      }
    };

    checkPrerequisites();
  }, [navigate]);

  const createNewDocument = async (uid: string, anamnesisId: string) => {
    const { data, error } = await supabase
      .from("value_chain_documents" as any)
      .insert({
        user_id: uid,
        anamnesis_id: anamnesisId,
        status: "mapping",
        conversation_history: [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      toast.error("Erro ao criar documento");
      return;
    }

    const doc = data as any;
    setDocumentId(doc.id);
    await initializeConversation(doc.id);
  };

  const initializeConversation = async (docId: string) => {
    const welcomeMessage = `Olá! Seja muito bem-vindo(a) 🚀

Esse robô foi criado para apoiar você no mapeamento da **cadeia de valor da sua empresa**, ou seja, todas as atividades e áreas essenciais que fazem seu negócio funcionar.

**Por que isso importa?**

A cadeia de valor vai te ajudar a:
✅ Ver tudo que precisa existir pro negócio rodar bem
✅ Identificar o que está sobrecarregado, ausente ou improvisado
✅ Decidir o que contratar, terceirizar ou automatizar
✅ Entender onde você está gastando energia vs. gerando resultado
✅ Ter base sólida pra montar o organograma depois
✅ Gerar matriz estratégica de priorização (estilo consultoria internacional)

**Como funciona:**
Eu vou conduzir você passo a passo, com perguntas simples, uma de cada vez. Não precisa ter todas as respostas de imediato — vamos construir juntos.

💡 **Dica:** Se preferir, pode responder por voz — eu transcrevo automaticamente.

**Tempo estimado:** 25-35 minutos

---

👉 **Pronto para começar?**`;

    const initialMessages: Message[] = [
      { role: "assistant", content: welcomeMessage }
    ];

    setMessages(initialMessages);

    await supabase
      .from("value_chain_documents" as any)
      .update({ conversation_history: initialMessages })
      .eq("id", docId);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !documentId || isLoading) return;

    const userMessage: Message = { role: "user", content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Save user message
      await supabase
        .from("value_chain_documents" as any)
        .update({ conversation_history: updatedMessages })
        .eq("id", documentId);

      // Call value-chain-chat edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/value-chain-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages,
            userId: session.user.id,
            documentId,
          }),
        }
      );

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === 'PRE_REQUISITE_MISSING') {
          toast.error("Você precisa completar a Anamnese Máxima primeiro");
          navigate("/anamnese-cultura");
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...updatedMessages];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.role === "assistant") {
                    lastMsg.content = assistantMessage;
                    return newMessages;
                  }
                  return [...newMessages, { role: "assistant", content: assistantMessage }];
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save complete conversation
      const finalMessages = [...updatedMessages, { role: "assistant", content: assistantMessage }];
      await supabase
        .from("value_chain_documents" as any)
        .update({ conversation_history: finalMessages })
        .eq("id", documentId);

      // Check if ready to generate (simple heuristic)
      const hasEnoughMessages = finalMessages.length >= 20;
      const lastMessage = assistantMessage.toLowerCase();
      const seemsComplete = lastMessage.includes("concluído") || 
                           lastMessage.includes("finalizar") ||
                           lastMessage.includes("relatório");
      
      setReadyToGenerate(hasEnoughMessages && seemsComplete);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!documentId) return;

    setIsLoading(true);
    toast.info("Gerando relatório completo...");

    try {
      // Get complete conversation
      const { data: doc } = await supabase
        .from("value_chain_documents" as any)
        .select("*")
        .eq("id", documentId)
        .single();

      if (!doc) throw new Error("Document not found");

      // Generate report
      const { data, error } = await supabase.functions.invoke("generate-value-chain-report", {
        body: {
          conversationHistory: (doc as any).conversation_history,
          anamnesisData: anamnesisData
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to generate report");
      }

      // Save to database
      await supabase
        .from("value_chain_documents" as any)
        .update({
          activities: data.data.activities,
          maturity_summary: data.data.maturity_summary,
          investment_summary: data.data.investment_summary,
          emotional_summary: data.data.emotional_summary,
          value_matrix: data.data.value_matrix,
          top_priorities: data.data.top_priorities,
          status: "completed"
        })
        .eq("id", documentId);

      toast.success("Relatório gerado com sucesso!");
      navigate(`/relatorio-valor-cadeia/${documentId}`);

    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingPrerequisite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAnamnesis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="bg-slate-800/50 border-red-500/30">
            <CardContent className="p-8 text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">
                Pré-requisito Necessário
              </h2>
              <p className="text-slate-300 text-lg">
                Para mapear a Cadeia de Valor, é essencial completar primeiro a <strong>Anamnese Máxima</strong>.
              </p>
              <p className="text-slate-400">
                A Anamnese me dá o contexto da sua empresa (tamanho, mercado, desafios), 
                e isso me ajuda a fazer perguntas mais assertivas aqui.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate("/anamnese-cultura")} size="lg" className="w-full">
                  Fazer Anamnese Máxima Agora
                </Button>
                <Button variant="ghost" onClick={() => navigate("/dashboard")} className="w-full">
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Cadeia de Valor Máxima 2.0
            </h1>
            <p className="text-slate-300">
              Mapeamento estratégico do macrofluxo empresarial
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Voltar
          </Button>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 mb-4">
          <CardContent className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-700 text-slate-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {readyToGenerate && (
          <Card className="bg-green-900/20 border-green-500/30 mb-4">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-green-300">
                ✅ Mapeamento completo! Pronto para gerar relatório.
              </p>
              <Button onClick={handleGenerateReport} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <VoiceInput
              onTranscription={handleSendMessage}
              disabled={isLoading}
            />
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
