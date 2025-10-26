import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, phone } = await req.json();

    console.log(`📧 Enviando boas-vindas para: ${email}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar user_id
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData.users.find(u => u.email === email);

    const welcomeEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6; margin-bottom: 24px;">Bem-vindo(a) à Máxima iA! 🚀</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">Olá ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          É um prazer ter você conosco! Você agora tem acesso às nossas ferramentas de estratégia empresarial.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          Crie seu <strong>MVV (Missão, Visão e Valores)</strong> e <strong>Cultura Organizacional</strong> de forma consultiva e personalizada.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://maximaia.com.br/dashboard" style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            🚀 Acessar Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Precisa de ajuda? Responda este email ou acesse nosso suporte.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
          Máxima iA - Estratégia Empresarial Inteligente
        </p>
      </div>
    `;

    // 1. Enviar Email
    await supabase.functions.invoke("send-email", {
      body: {
        email,
        subject: "🚀 Bem-vindo(a) à Máxima iA!",
        html: welcomeEmailHtml,
        type: "welcome",
        userId: user?.id,
      },
    });

    // 2. Enviar WhatsApp (se telefone fornecido)
    if (phone) {
      const whatsappMessage = `Olá ${name}! 👋\n\nBem-vindo(a) à Máxima iA! 🚀\n\nVocê agora tem acesso às nossas ferramentas de estratégia empresarial.\n\nCrie seu MVV (Missão, Visão e Valores) e Cultura Organizacional de forma consultiva e personalizada.\n\n✨ Comece agora: https://maximaia.com.br/dashboard\n\nQualquer dúvida, estamos aqui para ajudar!`;

      await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone,
          message: whatsappMessage,
          type: "welcome",
          userId: user?.id,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro ao enviar mensagens de boas-vindas:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
