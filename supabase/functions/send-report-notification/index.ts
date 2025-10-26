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
    const { userId, reportType, reportId, companyName } = await req.json();

    console.log(`📊 Enviando notificação de relatório: ${reportType} - ${companyName}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, company")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("Usuário não encontrado");
    }

    const reportTypeName = reportType === "mvv" 
      ? "MVV (Missão, Visão e Valores)" 
      : "Cultura Organizacional";

    const reportUrl = `https://maximaia.com.br/relatorio-${reportType}/${reportId}`;

    // Template de email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981; margin-bottom: 24px;">Seu relatório está pronto! 🎉</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">Olá ${profile.name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          Seu relatório <strong>${reportTypeName}</strong> da empresa <strong>${companyName}</strong> foi gerado com sucesso!
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${reportUrl}" style="background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            📄 Ver Relatório Completo
          </a>
        </div>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
          <p style="color: #059669; font-size: 14px; margin: 0;">
            💡 <strong>Dica:</strong> Na página do relatório você pode baixar em PDF, imprimir ou compartilhar com sua equipe.
          </p>
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
        email: profile.email,
        subject: `✅ Seu relatório ${reportTypeName} está pronto!`,
        html: emailHtml,
        type: "report_ready",
        userId,
      },
    });

    // 2. Enviar WhatsApp (se telefone cadastrado)
    const { data: profileWithPhone } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .single();

    // Verificar se a coluna phone existe antes de tentar acessá-la
    if (profileWithPhone && 'phone' in profileWithPhone && profileWithPhone.phone) {
      const whatsappMessage = `🎉 Seu relatório ${reportTypeName.toUpperCase()} está pronto!\n\n📊 ${companyName}\n\n👉 Ver agora: ${reportUrl}\n\nVocê pode baixar em PDF direto da plataforma.\n\n---\nMáxima iA`;

      await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: profileWithPhone.phone,
          message: whatsappMessage,
          type: "report_ready",
          userId,
        },
      });
    }

    console.log(`✅ Notificações enviadas para ${profile.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Erro ao enviar notificação de relatório:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
