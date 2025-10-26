import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
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

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "Máxima iA <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    });

    // Registrar log no banco
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("email_logs").insert({
      email,
      subject,
      type,
      status: emailResponse.error ? "failed" : "sent",
      error_message: emailResponse.error?.message || null,
      user_id: userId || null,
      metadata: emailResponse,
    });

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    console.log(`✅ Email enviado para ${email}`);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
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
