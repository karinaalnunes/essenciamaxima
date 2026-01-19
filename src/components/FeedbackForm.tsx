import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type FeedbackTable = "mvv_feedback" | "culture_feedback" | "process_feedback";

interface FeedbackFormProps {
  documentId: string;
  feedbackTable: FeedbackTable;
  onSubmit: () => void;
}

export function FeedbackForm({ documentId, feedbackTable, onSubmit }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ 
        title: "Por favor, selecione uma avaliação", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from(feedbackTable).insert({
      document_id: documentId,
      user_id: user?.id,
      rating,
      comments: comments.trim() || null,
    });

    if (error) {
      console.error("Error submitting feedback:", error);
      toast({ 
        title: "Erro ao enviar feedback", 
        variant: "destructive" 
      });
      setIsSubmitting(false);
      return;
    }

    toast({ title: "✨ Obrigado pelo seu feedback!" });
    onSubmit();
  };

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <h3 className="text-lg font-semibold text-white">
        Como foi sua experiência construindo o tripé da cultura?
      </h3>
      <p className="text-sm text-slate-300">
        Seu feedback me ajuda a continuar vivendo o nosso valor de Crescimento Contínuo! 🌱
      </p>
      
      {/* Estrelas */}
      <div className="flex gap-2 justify-center py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-all hover:scale-110 focus:outline-none"
            type="button"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-600"
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <p className="text-center text-sm text-slate-400">
          {rating === 5 && "Incrível! 🎉"}
          {rating === 4 && "Muito bom! 👏"}
          {rating === 3 && "Legal! 👍"}
          {rating === 2 && "Pode melhorar 🤔"}
          {rating === 1 && "Vamos trabalhar nisso 💪"}
        </p>
      )}

      {/* Campo de texto */}
      <Textarea
        placeholder="Conte mais sobre sua experiência ou sugestões de melhoria..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="min-h-[100px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
      />

      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Enviar Feedback"
        )}
      </Button>
    </Card>
  );
}
