import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageFormatter } from "@/components/MessageFormatter";
import { FeedbackForm } from "@/components/FeedbackForm";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import logo from "@/assets/logo-maxima-ia-negativo.png";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function NovoMVV() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number>(Date.now());
  const [conversationMetricId, setConversationMetricId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const { displayedText, startTyping, isTyping } = useTypingEffect(20);

  useEffect(() => {
    // Prevenir execuções múltiplas
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        setUserId(user.id);

        // Verificar se há um docId na query string
        const docIdFromQuery = searchParams.get("doc");
        
        if (docIdFromQuery) {
          // Validar que o documento pertence ao usuário
          const { data: doc, error } = await supabase
            .from("mvv_documents")
            .select("*")
            .eq("id", docIdFromQuery)
            .eq("user_id", user.id)
            .single();

          if (error || !doc) {
            toast({
              title: "Documento não encontrado",
              description: "Redirecionando para o dashboard...",
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }

          // Carregar conversa deste documento específico
          await loadExistingConversation(docIdFromQuery);
          return;
        }

        // Se não há docId na query, seguir fluxo normal
        // Buscar MVV existente do usuário (ordenar por mais recente)
        const { data: existingDocs } = await supabase
          .from('mvv_documents')
          .select('id, mission, vision, values, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!existingDocs || existingDocs.length === 0) {
          // Não tem nenhum MVV → criar novo
          await initializeConversation(user.id);
          return;
        }

        // Verificar se tem MVV completo
        const completedMVV = existingDocs.find(
          doc => doc.mission && doc.vision && doc.values
        );

        if (completedMVV) {
          // Já tem MVV completo → redirecionar para o relatório
          navigate(`/relatorio/${completedMVV.id}`);
          return;
        }

        // Encontrar o documento incompleto mais recente (sem deletar outros)
        const incompleteMVV = existingDocs[0];
        await loadExistingConversation(incompleteMVV.id);

      } catch (error) {
        console.error('Error checking user:', error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível verificar seu perfil. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkUser();
  }, [navigate, searchParams, toast]);

  // Detect user scrolling
  const handleUserScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 2000);
  };

  useEffect(() => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    scrollArea?.addEventListener('scroll', handleUserScroll);
    return () => scrollArea?.removeEventListener('scroll', handleUserScroll);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive (only if user is not scrolling)
    if (!isUserScrolling && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      }, 100);
    }
  }, [messages, isLoading, messageSending, isUserScrolling]);

  // Show feedback when ready to generate
  useEffect(() => {
    if (readyToGenerate && !showFeedback && !feedbackSubmitted) {
      setShowFeedback(true);
      
      // Add message about generating report
      const generatingMsg: Message = {
        role: 'assistant',
        content: '✨ Já estou gerando o seu relatório! Enquanto isso...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, generatingMsg]);
    }
  }, [readyToGenerate, showFeedback, feedbackSubmitted]);

  const loadExistingConversation = async (docId: string) => {
    try {
      setDocumentId(docId);

      // Carregar histórico de conversa do banco
      const { data: history, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!history || history.length === 0) {
        // Histórico vazio → inicializar conversa normalmente
        await initializeNewConversation(docId);
        return;
      }

      // Restaurar mensagens
      const loadedMessages: Message[] = history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));

      setMessages(loadedMessages);

      // Verificar se a última mensagem é a pergunta de confirmação
      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage?.role === 'assistant' && 
          lastMessage.content.includes('Você está pronto(a) para começar?')) {
        setAwaitingConfirmation(true);
      }

      // Verificar se já está pronto para gerar (seria raro, mas possível)
      const hasReadySignal = loadedMessages.some(msg => 
        msg.content.includes('Informações coletadas') || 
        msg.content.includes('gerar seu MVV')
      );
      if (hasReadySignal) {
        setReadyToGenerate(true);
      }

      toast({
        title: "Conversa recuperada! 🔄",
        description: "Continue de onde você parou.",
      });

    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Erro ao carregar conversa",
        description: "Não foi possível recuperar o histórico. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const initializeConversation = async (uid: string) => {
    try {
      // Create a new document placeholder
      const { data, error } = await supabase
        .from('mvv_documents')
        .insert({
          user_id: uid,
          title: 'Novo MVV - ' + new Date().toLocaleDateString('pt-BR'),
          company_name: 'Em construção',
          segment: 'A definir',
        })
        .select()
        .single();

      if (error) throw error;
      
      await initializeNewConversation(data.id);

    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Erro ao iniciar conversa",
        description: "Não foi possível iniciar a consultoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const initializeNewConversation = async (docId: string) => {
    setDocumentId(docId);

    // Mensagens sequenciais para melhor UX - agora com confirmação
    const sequentialMessages = [
      {
        content: `Olá! Seja muito bem-vindo(a) ao Essência Máxima 🚀

Esse é um espaço criado para revelar a Missão, Visão e Valores da sua empresa de forma leve, consultiva e inspiradora.`,
        delay: 0
      },
      {
        content: `Eu vou te conduzir passo a passo, sempre com perguntas simples e objetivas. Você não precisa ter tudo pronto agora: vamos construir juntos.

💡 **Se preferir, pode responder por voz** — eu transcrevo automaticamente para você. Assim, fica mais fluido e natural.`,
        delay: 1500
      },
      {
        content: `Você está pronto(a) para começar? 😊`,
        delay: 2500
      }
    ];

    // Enviar mensagens com delay progressivo
    for (const msg of sequentialMessages) {
      await new Promise(resolve => setTimeout(resolve, msg.delay));
      
      const message: Message = {
        role: 'assistant',
        content: msg.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, message]);

      // Salvar cada mensagem no histórico
      await supabase.from('conversation_history').insert({
        document_id: docId,
        role: 'assistant',
        content: msg.content,
      });
    }

    // Marcar que estamos aguardando confirmação do usuário
    setAwaitingConfirmation(true);
  };

  const handleTranscription = async (text: string) => {
    if (!text.trim() || !documentId) return;

    // Show sending feedback
    setMessageSending(true);
    
    // Add user message to UI
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setMessageSending(false);

    try {
      // Se estamos aguardando confirmação, verificar se é resposta positiva
      if (awaitingConfirmation) {
        const positiveResponses = ['sim', 'vamos', 'pronto', 'pode', 'começar', 'claro', 'ok', 'yes', 'bora'];
        const isPositive = positiveResponses.some(word => 
          text.toLowerCase().includes(word)
        );

        if (isPositive) {
          // Salvar resposta do usuário
          await supabase.from('conversation_history').insert({
            document_id: documentId,
            role: 'user',
            content: text,
          });

          setAwaitingConfirmation(false);

          // Enviar mensagem com as perguntas básicas
          const questionsMessage: Message = {
            role: 'assistant',
            content: `📋 Perfeito! Para começar, me conte alguns dados básicos:
• **Nome da empresa**
• **Segmento de atuação**
• **Localização** (cidade/estado)
• **Número de colaboradores**
• **Porte da empresa** (micro, pequena, média ou grande)

Pode compartilhar essas informações?`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, questionsMessage]);

          await supabase.from('conversation_history').insert({
            document_id: documentId,
            role: 'assistant',
            content: questionsMessage.content,
          });

          return;
        }
      }

      setIsLoading(true);

      // Get user session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Fetch fresh conversation history from database to avoid stale state
      const { data: freshHistory, error: historyError } = await supabase
        .from('conversation_history')
        .select('role, content')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching fresh history:', historyError);
      }

      // Call consultative chat with streaming and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consultative-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: text,
            conversationHistory: freshHistory || [],
            documentId: documentId,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
      }

      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let streamDone = false;

      // Add placeholder assistant message
      const placeholderMsg: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, placeholderMsg]);

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
        while (!streamDone) {
          if (streamTimedOut) throw new Error('Stream timeout - nenhum dado recebido por 30s');

          const { done, value } = await reader.read();
          if (streamTimedOut) throw new Error('Stream timeout - nenhum dado recebido por 30s');
          if (done) break;

          resetInactivityTimeout();
          buffer += decoder.decode(value, { stream: true });

          // Process line by line
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;

              if (content) {
                assistantContent += content;

                // Keep state in sync so the message doesn't "disappear" if typing finishes
                // before the stream ends (or if the stream is interrupted).
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === "assistant") {
                    lastMsg.content = assistantContent;
                  }
                  return newMessages;
                });

                // Typing effect is only for display while streaming
                startTyping(assistantContent);
              }
            } catch (e) {
              // Incomplete JSON, put it back
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw || raw.startsWith(':') || !raw.trim()) continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.content = assistantContent;
                  }
                  return newMessages;
                });
              }
            } catch {
              /* ignore */
            }
          }
        }
      } finally {
        if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId);
      }

      // Save assistant message to database
      await supabase.from('conversation_history').insert({
        document_id: documentId,
        role: 'assistant',
        content: assistantContent,
      });

      // Check if ready to generate
      if (assistantContent.includes('[PRONTO_PARA_GERAR]')) {
        setReadyToGenerate(true);
        // Remove the marker from displayed message
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.content = lastMsg.content.replace('[PRONTO_PARA_GERAR]', '').trim();
          }
          return newMessages;
        });
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const isTimeout = error?.name === 'AbortError';
      toast({
        title: isTimeout ? "Tempo esgotado" : "Erro na conversa",
        description: isTimeout 
          ? "O servidor demorou muito para responder. Tente novamente." 
          : "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
      
      // Remove placeholder message on error
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1]?.role === 'assistant' && !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMVV = async () => {
    setIsGenerating(true);
    try {
      // Get full conversation history from database
      const { data: history, error: historyError } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;

      // Build conversation text
      const conversationText = history
        .map(msg => `${msg.role === 'user' ? 'Cliente' : 'Consultor'}: ${msg.content}`)
        .join('\n\n');

      // Call generate-mvv with conversation history
      const { data, error } = await supabase.functions.invoke('generate-mvv', {
        body: { conversationHistory: conversationText }
      });

      if (error) throw error;

      // Update the document with complete MVV
      const { error: updateError } = await supabase
        .from('mvv_documents')
        .update({
          company_name: data.company_name || 'Empresa',
          segment: data.segment || 'A definir',
          company_size: data.company_size,
          company_context: data.company_context,
          mission: data.mission,
          mission_pocket: data.mission_pocket,
          mission_punchline: data.mission_punchline,
          vision: data.vision,
          vision_indicators: data.vision_indicators,
          values: data.values,
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Enviar notificação de relatório pronto
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.functions.invoke("send-report-notification", {
          body: {
            userId: user.id,
            reportType: "mvv",
            reportId: documentId,
            companyName: data.company_name || 'Empresa',
          },
        });
      }

      toast({
        title: "✨ MVV gerado com sucesso!",
        description: "Redirecionando para o relatório completo...",
      });

      setTimeout(() => navigate(`/relatorio/${documentId}`), 1500);

    } catch (error) {
      console.error('Error generating MVV:', error);
      toast({
        title: "Erro ao gerar MVV",
        description: "Não foi possível gerar o MVV. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Loading inicial
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-slate-300">Carregando sua consultoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col p-2 md:p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)]">
        {/* Header - Compact on mobile */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-t-2xl border border-slate-800 border-b-0 p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white h-8 w-8 md:h-10 md:w-10"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white">Consultoria MVV</h1>
                <p className="text-slate-400 text-xs md:text-sm hidden md:block">Vamos criar sua Missão, Visão e Valores</p>
              </div>
            </div>
            <img src={logo} alt="Máxima iA" className="h-10 md:h-20 w-auto" />
          </div>
        </div>

        {/* Chat Messages - More space on mobile */}
        <ScrollArea 
          ref={scrollRef}
          className="flex-1 bg-slate-900/30 border-x border-slate-800 p-3 md:p-6"
        >
          <div className="space-y-3 md:space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, index) => {
              const isLastAssistant = 
                index === messages.length - 1 && 
                msg.role === 'assistant' && 
                isTyping;
              
              return (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={msg.role === 'user' ? 'max-w-[90%] md:max-w-[85%]' : 'max-w-[90%] md:max-w-[85%]'}>
                    <MessageFormatter 
                      content={isLastAssistant ? displayedText : msg.content} 
                      role={msg.role} 
                    />
                    <p className="text-xs text-slate-500 mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {messageSending && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl p-3 md:p-4 bg-gradient-cta/80 text-white animate-pulse">
                  <p className="text-sm">Enviando...</p>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-slate-800/50 border border-slate-700 rounded-2xl p-3 md:p-4 animate-fade-in">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-blue-400" />
                    <div className="space-y-0.5 md:space-y-1">
                      <p className="text-xs md:text-sm font-medium text-slate-200">Analisando...</p>
                      <p className="text-xs text-slate-400 hidden md:block">Isso pode levar alguns segundos</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Feedback Form */}
        {showFeedback && !feedbackSubmitted && (
          <div className="px-3 md:px-4 pb-2 md:pb-4 bg-slate-900/30 border-x border-slate-800">
            <FeedbackForm
              documentId={documentId!}
              onSubmit={() => {
                setFeedbackSubmitted(true);
                setShowFeedback(false);
              }}
            />
          </div>
        )}

        {/* Generate MVV Button */}
        {feedbackSubmitted && !isGenerating && (
          <div className="px-3 md:px-4 pb-2 md:pb-4 bg-slate-900/30 border-x border-slate-800">
            <Button 
              onClick={handleGenerateMVV} 
              className="w-full"
              size="lg"
            >
              Ver Meu MVV
            </Button>
          </div>
        )}

        {/* Voice Input - Compact on mobile */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-b-2xl border border-slate-800 border-t-0 p-3 md:p-6">
          <VoiceInput
            onTranscription={handleTranscription}
            disabled={isLoading || isGenerating || messageSending}
          />
          
          {isGenerating && (
            <div className="mt-2 md:mt-4 flex items-center justify-center gap-2 md:gap-3 text-blue-400">
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              <span className="text-xs md:text-sm font-medium">Gerando seu MVV...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
