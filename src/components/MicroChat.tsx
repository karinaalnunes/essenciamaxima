import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MicroChatProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  systemPrompt: string;
  triggerFollowUp?: (response: string) => boolean;
}

export function MicroChat({
  label,
  value,
  onChange,
  placeholder,
  systemPrompt,
  triggerFollowUp,
}: MicroChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || loading) return;

    setLoading(true);
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke("consultative-chat", {
        body: {
          messages: newMessages,
          systemPrompt,
        },
      });

      if (error) throw error;

      const assistantMessage = data.response;
      setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);

      // Auto-save response se for uma resposta final
      if (triggerFollowUp && !triggerFollowUp(userMessage)) {
        onChange(userMessage);
      }
    } catch (error: any) {
      console.error("Error in micro chat:", error);
      toast({
        title: "Erro na conversa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // Salvar a conversa completa
    const fullResponse = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ");
    onChange(fullResponse);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="pr-12"
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              title="Conversar com IA"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20 mb-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Comece a conversa respondendo à pergunta acima.
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card border rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Digite sua resposta..."
                  rows={2}
                  disabled={loading}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleComplete}
                    variant="outline"
                    size="sm"
                    disabled={messages.length === 0}
                  >
                    Concluir
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
