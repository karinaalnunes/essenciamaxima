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

    const reportTypeLabel = reportType === "mvv" 
      ? "MVV" 
      : "Cultura Organizacional";

    const reportUrl = `https://maximaia.com.br/relatorio-${reportType}/${reportId}`;

    // Template de email com identidade visual
    const emailHtml = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: linear-gradient(135deg, rgba(155, 135, 245, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%); padding: 20px 40px; border-radius: 16px;">
          <h2 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0;">
            🎉 Seu Relatório está Pronto!
          </h2>
        </div>
      </div>
      
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Olá, <strong style="color: #ffffff;">${profile.name}</strong>!
      </p>
      
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Ótimas notícias! Seu relatório de <strong style="color: #9b87f5;">${reportTypeLabel}</strong> 
        para <strong style="color: #3b82f6;">${companyName}</strong> foi gerado com sucesso! 🚀
      </p>
      
      <div style="background: linear-gradient(135deg, rgba(155, 135, 245, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid rgba(155, 135, 245, 0.3); padding: 25px; border-radius: 16px; margin: 30px 0;">
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
          ✨ <strong style="color: #ffffff;">O que fazer agora?</strong>
        </p>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Acesse seu dashboard para visualizar o relatório completo</li>
          <li>Baixe o PDF para compartilhar com sua equipe</li>
          <li>Comece a implementar as estratégias recomendadas</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${reportUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-weight: 600; font-size: 17px; box-shadow: 0 10px 30px rgba(155, 135, 245, 0.4);">
          Ver Meu Relatório Agora
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
        Continue transformando sua empresa,<br>
        <strong style="color: #ffffff;">Equipe Máxima iA</strong> 💜
      </p>
    `;

    // 1. Enviar Email
    await supabase.functions.invoke("send-email", {
      body: {
        email: profile.email,
        subject: `Seu Relatório de ${reportTypeLabel} está Pronto! 🎉`,
        html: emailHtml,
        type: "report_ready",
        userId,
      },
    });

    // 2. Enviar WhatsApp regionalizado (se telefone cadastrado)
    const { data: profileWithPhone } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .single();

    if (profileWithPhone && 'phone' in profileWithPhone && profileWithPhone.phone) {
      const phone = profileWithPhone.phone;
      const ddd = phone.replace(/\D/g, "").substring(2, 4);
      const dddNum = parseInt(ddd);
      
      let greeting = "Olá! 👋";
      if ([41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55].includes(dddNum)) {
        greeting = "Bah, tchê! 🧉";
      } else if ([71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 98, 99].includes(dddNum)) {
        greeting = "Oxe, visse! 🦀";
      } else if ([21, 22, 24].includes(dddNum)) {
        greeting = "E aí, meu rei/rainha! 🏖️";
      } else if ([31, 32, 33, 34, 35, 37, 38].includes(dddNum)) {
        greeting = "Opa, sô! ⛰️";
      } else if ([11, 12, 13, 14, 15, 16, 17, 18, 19].includes(dddNum)) {
        greeting = "E aí, mano! 🏙️";
      } else if ([61, 62, 63, 64, 65, 66, 67, 68, 69, 91, 92, 93, 94, 95, 96, 97].includes(dddNum)) {
        greeting = "Fala, brother! 🌳";
      }

      const whatsappMessage = `${greeting}

${profile.name}, temos novidades! 🎉

Seu relatório de *${reportTypeLabel}* para *${companyName}* ficou pronto agora!

📊 Acesse seu dashboard e confira todas as análises e recomendações que preparamos pra você.

🔗 ${reportUrl}

Continue transformando sua empresa! 💜

*Equipe Máxima iA*`;

      await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone,
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
