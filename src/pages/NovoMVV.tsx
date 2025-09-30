import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo-maxima-ia.png";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function NovoMVV() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
        await initializeConversation(user.id);
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      
      setDocumentId(data.id);

      // Add initial AI message
      const initialMessage: Message = {
        role: 'assistant',
        content: '👋 Olá! É um prazer conhecê-lo.\n\n🎤 Recomendação: Use o áudio! Nossa IA transcreve automaticamente sua fala.\n⌨️ Se preferir, você também pode digitar suas respostas.\n\nVamos começar? Primeiro, qual é o nome da sua empresa?',
        timestamp: new Date()
      };
      setMessages([initialMessage]);

      // Save initial message to database
      await supabase.from('conversation_history').insert({
        document_id: data.id,
        role: 'assistant',
        content: initialMessage.content,
      });

    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Erro ao iniciar conversa",
        description: "Não foi possível iniciar a consultoria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleTranscription = async (text: string) => {
    if (!text.trim() || !documentId) return;

    // Add user message to UI
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call consultative chat
      const { data, error } = await supabase.functions.invoke('consultative-chat', {
        body: {
          message: text,
          conversationHistory: messages,
          documentId: documentId,
        }
      });

      if (error) throw error;

      // Add AI response to UI
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Check if ready to generate
      if (data.readyToGenerate) {
        setReadyToGenerate(true);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Erro na conversa",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive",
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

      // Update the document with generated MVV
      const { error: updateError } = await supabase
        .from('mvv_documents')
        .update({
          mission: data.mission,
          vision: data.vision,
          values: data.values,
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast({
        title: "MVV gerado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });

      setTimeout(() => navigate('/dashboard'), 1500);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-t-2xl border border-slate-800 border-b-0 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Consultoria MVV</h1>
                <p className="text-slate-400 text-sm">Vamos criar sua Missão, Visão e Valores</p>
              </div>
            </div>
            <img src={logo} alt="Máxima iA" className="h-10 w-auto" />
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea 
          ref={scrollRef}
          className="flex-1 bg-slate-900/30 border-x border-slate-800 p-6"
        >
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-cta text-white'
                      : 'bg-slate-800/50 text-slate-100 border border-slate-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 text-slate-100 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Voice Input Footer */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-b-2xl border border-slate-800 border-t-0 p-6">
          <div className="flex flex-col items-center gap-4">
            {readyToGenerate ? (
              <div className="text-center space-y-4">
                <p className="text-slate-300">
                  Informações coletadas! Posso gerar seu MVV agora?
                </p>
                <Button
                  onClick={handleGenerateMVV}
                  disabled={isGenerating}
                  size="lg"
                  className="bg-gradient-cta"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando MVV...
                    </>
                  ) : (
                    'Gerar MVV'
                  )}
                </Button>
              </div>
            ) : (
              <VoiceInput 
                onTranscription={handleTranscription}
                disabled={isLoading || isGenerating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
