import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    console.log("Checking for no-show meetings...");

    // Get meetings that should have happened in the last hour but weren't confirmed or cancelled
    const { data: meetings, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", oneHourAgo.toISOString());

    if (error) {
      console.error("Error fetching meetings:", error);
      throw error;
    }

    console.log(`Found ${meetings?.length || 0} no-show meetings`);

    for (const meeting of meetings || []) {
      console.log(`Marking meeting ${meeting.id} as no_show`);

      // Update meeting status to no_show
      const { error: updateError } = await supabase
        .from("meetings")
        .update({ 
          status: "no_show",
          completed_at: now.toISOString()
        })
        .eq("id", meeting.id);

      if (updateError) {
        console.error(`Error updating meeting ${meeting.id}:`, updateError);
        continue;
      }

      // Get user profile for notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, phone")
        .eq("id", meeting.user_id)
        .single();

      if (profile) {
        // Send notification about no-show
        const message = `Olá ${profile.name},\n\n` +
                       `Notamos que você não compareceu à reunião "${meeting.title}" agendada para hoje.\n\n` +
                       `⚠️ Como o cancelamento não foi feito com 24h de antecedência, esta sessão será considerada como realizada.\n\n` +
                       `Se houve algum problema, por favor entre em contato conosco.`;

        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject: "Reunião não comparecida",
              html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
              type: "meeting_no_show",
              userId: meeting.user_id,
            },
          });
          console.log(`No-show notification email sent for meeting ${meeting.id}`);
        } catch (emailError) {
          console.error("Error sending no-show email:", emailError);
        }

        if (profile.phone) {
          try {
            await supabase.functions.invoke("send-whatsapp", {
              body: {
                phone: profile.phone,
                message: message,
                type: "meeting_no_show",
                userId: meeting.user_id,
              },
            });
            console.log(`No-show notification WhatsApp sent for meeting ${meeting.id}`);
          } catch (whatsappError) {
            console.error("Error sending no-show WhatsApp:", whatsappError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: meetings?.length || 0,
        message: "No-shows processed successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("Error in check-meeting-no-shows:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
