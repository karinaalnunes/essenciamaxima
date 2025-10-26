import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  subject: string;
  html: string;
  type: "welcome" | "password_reset" | "report_ready" | "notification";
  userId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject, html, type, userId }: EmailRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("⚠️ Resend API Key não configurada");
      
      // Registrar log mesmo sem enviar
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase.from("email_logs").insert({
        email,
        subject,
        type,
        status: "pending",
        error_message: "Resend API Key not configured",
        user_id: userId || null,
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Resend não configurado. Email registrado." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enviar via Resend API diretamente
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Máxima iA <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: html,
      }),
    });

    const emailData = await emailResponse.json();

    // Registrar log no banco
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("email_logs").insert({
      email,
      subject,
      type,
      status: emailResponse.ok ? "sent" : "failed",
      error_message: emailResponse.ok ? null : JSON.stringify(emailData),
      user_id: userId || null,
      metadata: emailData,
    });

    if (!emailResponse.ok) {
      throw new Error(`Resend error: ${JSON.stringify(emailData)}`);
    }

    console.log(`✅ Email enviado para ${email}`);

    return new Response(
      JSON.stringify({ success: true, id: emailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
