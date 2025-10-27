import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Download, CheckCircle, XCircle } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadICS } from "@/lib/icsGenerator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  meeting_type: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  confirmed_at?: string;
}

interface MeetingsListProps {
  meetings: Meeting[];
  onRefresh: () => void;
  maxItems?: number;
}

const meetingTypeLabels = {
  onboarding: "Onboarding",
  follow_up: "Acompanhamento",
  review: "Revisão",
  strategic: "Estratégica",
  emergency: "Emergencial",
};

const statusColors = {
  scheduled: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
  no_show: "destructive",
} as const;

const statusLabels = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Concluída",
  no_show: "Não Compareceu",
};

export function MeetingsList({ meetings, onRefresh, maxItems }: MeetingsListProps) {
  const displayMeetings = maxItems ? meetings.slice(0, maxItems) : meetings;

  const handleConfirm = async (meetingId: string) => {
    const { error } = await supabase
      .from("meetings")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", meetingId);

    if (error) {
      toast.error("Erro ao confirmar reunião");
      return;
    }

    toast.success("Presença confirmada!");
    onRefresh();
  };

  const handleCancel = async (meetingId: string, scheduledAt: string) => {
    const hoursUntilMeeting = differenceInHours(new Date(scheduledAt), new Date());
    
    if (hoursUntilMeeting < 24) {
      toast.error("⚠️ Cancelamentos devem ser feitos com no mínimo 24h de antecedência");
      return;
    }

    const { error } = await supabase
      .from("meetings")
      .update({ 
        status: "cancelled", 
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "Cancelado pelo usuário"
      })
      .eq("id", meetingId);

    if (error) {
      toast.error("Erro ao cancelar reunião");
      return;
    }

    toast.success("Reunião cancelada");
    onRefresh();
  };

  if (displayMeetings.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhuma reunião agendada no momento
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayMeetings.map((meeting) => (
        <Card key={meeting.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{meeting.title}</h4>
                <Badge variant={statusColors[meeting.status]}>
                  {statusLabels[meeting.status]}
                </Badge>
                <Badge variant="outline">
                  {meetingTypeLabels[meeting.meeting_type as keyof typeof meetingTypeLabels]}
                </Badge>
              </div>

              {meeting.description && (
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(meeting.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(meeting.scheduled_at), "HH:mm", { locale: ptBR })} ({meeting.duration_minutes}min)
                </div>
                {meeting.meeting_url && (
                  <a 
                    href={meeting.meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Video className="h-4 w-4" />
                    Link da Reunião
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {meeting.status === "scheduled" && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleConfirm(meeting.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(meeting.id, meeting.scheduled_at)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </>
              )}
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadICS(meeting)}
              >
                <Download className="h-4 w-4 mr-1" />
                .ics
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
