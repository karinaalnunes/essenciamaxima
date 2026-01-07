import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Mic, MicOff, Loader2, Keyboard, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscription, disabled }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            toast({
              title: "Erro",
              description: "Não foi possível processar o áudio",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          try {
            // Call transcription edge function
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (error) throw error;

            onTranscription(data.text);
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "Erro na transcrição",
              description: "Não foi possível transcrever o áudio. Tente novamente.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        };

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro ao acessar microfone",
        description: "Permita o acesso ao microfone para continuar",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTextSubmit = () => {
    const trimmedText = textInput.trim();
    if (!trimmedText || disabled || isProcessing) return;
    
    onTranscription(trimmedText);
    setTextInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Detect touch device for more reliable mobile detection
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const shouldUseMobileBehavior = isMobile || isTouchDevice;
    
    // No mobile/touch, Enter sempre cria nova linha (usuário usa botão para enviar)
    if (shouldUseMobileBehavior) return;
    
    // No desktop, Enter envia e Shift+Enter cria nova linha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [textInput]);

  // Detect touch device for more reliable mobile detection
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const shouldUseMobileBehavior = isMobile || isTouchDevice;

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 w-full max-w-full md:max-w-md mx-auto px-2 md:px-0 overflow-hidden">
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "voice" | "text")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
          <TabsTrigger value="voice" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Mic className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Áudio
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Keyboard className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Texto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="flex flex-col items-center gap-2 md:gap-3 mt-2 md:mt-4">
          <Button
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
            className={`h-12 w-12 md:h-16 md:w-16 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-cta hover:scale-110'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-5 w-5 md:h-6 md:w-6" />
            ) : (
              <Mic className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </Button>
          
          <p className="text-xs md:text-sm text-muted-foreground">
            {isProcessing 
              ? 'Transcrevendo...' 
              : isRecording 
              ? 'Clique para parar' 
              : 'Clique para falar'}
          </p>
        </TabsContent>

        <TabsContent value="text" className="flex flex-col gap-2 mt-2 md:mt-4 w-full overflow-hidden">
          <div className="flex gap-2 items-end w-full overflow-hidden">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua resposta..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={disabled || isProcessing}
              className="flex-1 min-w-0 min-h-[80px] md:min-h-[100px] max-h-[200px] md:max-h-[300px] resize-none overflow-y-auto text-base"
              autoFocus={!shouldUseMobileBehavior}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={disabled || isProcessing || !textInput.trim()}
              size="icon"
              className="shrink-0 h-10 w-10 md:h-10 md:w-10"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {shouldUseMobileBehavior 
              ? 'Toque no botão azul para enviar' 
              : 'Enter para enviar • Shift+Enter para nova linha'}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
