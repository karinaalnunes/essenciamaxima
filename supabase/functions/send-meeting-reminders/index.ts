import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

    console.log("Checking meetings for reminders...");

    // Get meetings that need reminders
    const { data: meetings, error } = await supabase
      .from("meetings")
      .select(`
        *,
        profiles!meetings_user_id_fkey(name, email, phone)
      `)
      .eq("status", "scheduled")
      .or(
        `and(reminder_24h_sent.eq.false,scheduled_at.gte.${now.toISOString()},scheduled_at.lte.${in24Hours.toISOString()}),` +
        `and(reminder_1h_sent.eq.false,scheduled_at.gte.${now.toISOString()},scheduled_at.lte.${in1Hour.toISOString()}),` +
        `and(reminder_15min_sent.eq.false,scheduled_at.gte.${now.toISOString()},scheduled_at.lte.${in15Minutes.toISOString()})`
      );

    if (error) {
      console.error("Error fetching meetings:", error);
      throw error;
    }

    console.log(`Found ${meetings?.length || 0} meetings needing reminders`);

    for (const meeting of meetings || []) {
      const profile = meeting.profiles as any;
      const scheduledTime = new Date(meeting.scheduled_at);
      const hoursUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));

      let reminderType = "";
      let updateField = "";
      let message = "";

      if (!meeting.reminder_24h_sent && hoursUntil <= 24 && hoursUntil > 1) {
        reminderType = "24h";
        updateField = "reminder_24h_sent";
        const meetingDate = scheduledTime.toLocaleDateString("pt-BR");
        const meetingTime = scheduledTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        message = `Oi ${profile.name}! 📅 Lembrete: você tem uma reunião amanhã (${meetingDate}) às ${meetingTime}.\n\n` +
                 `⚠️ Por favor, confirme sua presença. Cancelamentos devem ser feitos com no mínimo 24h de antecedência.\n\n` +
                 `Link: ${meeting.meeting_url || "Será enviado em breve"}`;
      } else if (!meeting.reminder_1h_sent && hoursUntil <= 1 && minutesUntil > 15) {
        reminderType = "1h";
        updateField = "reminder_1h_sent";
        const meetingTime = scheduledTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        message = `🔔 Sua reunião "${meeting.title}" começa em 1 hora (${meetingTime})!\n\n` +
                 `Link: ${meeting.meeting_url || "Aguardando confirmação"}`;
      } else if (!meeting.reminder_15min_sent && minutesUntil <= 15) {
        reminderType = "15min";
        updateField = "reminder_15min_sent";
        message = `⏰ Sua reunião "${meeting.title}" começa em 15 minutos!\n\n` +
                 `${meeting.meeting_url ? `Acesse agora: ${meeting.meeting_url}` : "Aguarde o link da reunião"}`;
      }

      if (reminderType) {
        console.log(`Sending ${reminderType} reminder for meeting ${meeting.id}`);

        // Send email
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject: `Lembrete: Reunião ${reminderType === "24h" ? "amanhã" : reminderType === "1h" ? "em 1 hora" : "em 15 minutos"}`,
              html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
              type: "meeting_reminder",
              userId: meeting.user_id,
            },
          });
          console.log(`Email sent for ${reminderType} reminder`);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }

        // Send WhatsApp if phone exists
        if (profile.phone) {
          try {
            await supabase.functions.invoke("send-whatsapp", {
              body: {
                phone: profile.phone,
                message: message,
                type: "meeting_reminder",
                userId: meeting.user_id,
              },
            });
            console.log(`WhatsApp sent for ${reminderType} reminder`);
          } catch (whatsappError) {
            console.error("Error sending WhatsApp:", whatsappError);
          }
        }

        // Mark reminder as sent
        await supabase
          .from("meetings")
          .update({ [updateField]: true })
          .eq("id", meeting.id);

        console.log(`Marked ${updateField} as true for meeting ${meeting.id}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: meetings?.length || 0,
        message: "Reminders processed successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
