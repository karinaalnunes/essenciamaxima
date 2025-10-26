import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  phone: string;
  message: string;
  type: "welcome" | "password_reset" | "report_ready" | "notification";
  userId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, type, userId }: WhatsAppRequest = await req.json();

    // Validar telefone (formato internacional)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      throw new Error("Telefone inválido. Use formato internacional: +5511987654321");
    }

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Se credenciais não configuradas, apenas logar (modo preparação)
    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.log("⚠️ Twilio não configurado. Simulando envio:");
      console.log(`📱 Para: ${phone}`);
      console.log(`💬 Mensagem: ${message}`);
      
      // Criar log no banco mesmo sem enviar
      await supabase.from("whatsapp_logs").insert({
        phone,
        message,
        type,
        status: "pending",
        user_id: userId || null,
        error_message: "Twilio credentials not configured",
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Twilio não configurado. Mensagem registrada." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enviar via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams({
      From: `whatsapp:${twilioWhatsAppNumber}`,
      To: `whatsapp:${phone}`,
      Body: message,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const twilioData = await twilioResponse.json();

    // Registrar log no banco
    await supabase.from("whatsapp_logs").insert({
      phone,
      message,
      type,
      status: twilioResponse.ok ? "sent" : "failed",
      user_id: userId || null,
      error_message: twilioResponse.ok ? null : twilioData.message,
      metadata: twilioData,
    });

    if (!twilioResponse.ok) {
      throw new Error(`Twilio error: ${twilioData.message}`);
    }

    console.log(`✅ WhatsApp enviado para ${phone}`);

    return new Response(
      JSON.stringify({ success: true, sid: twilioData.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Erro ao enviar WhatsApp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
