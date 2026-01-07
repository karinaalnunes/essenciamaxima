import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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

// Template base com identidade visual Máxima iA
function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="background: rgba(155, 135, 245, 0.1); border: 1px solid rgba(155, 135, 245, 0.3); border-radius: 20px; padding: 30px; display: inline-block;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #9b87f5 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              Máxima iA
            </h1>
          </div>
        </div>

        <!-- Conteúdo -->
        <div style="background: rgba(30, 30, 46, 0.8); border: 1px solid rgba(155, 135, 245, 0.2); border-radius: 24px; padding: 40px; backdrop-filter: blur(10px);">
          ${content}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
            © 2025 Máxima iA - Transformando visão em cultura
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Este é um e-mail automático, por favor não responda.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
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

    // Enviar via Resend API diretamente com template visual
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
        html: getEmailTemplate(html),
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
