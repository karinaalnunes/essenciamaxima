import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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
      <h2 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
        Bem-vindo à Máxima iA, ${name}! 🎉
      </h2>
      
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Estamos muito felizes em ter você conosco! Você está a um passo de transformar a cultura da sua empresa.
      </p>
      
      <div style="background: linear-gradient(135deg, rgba(155, 135, 245, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border-left: 4px solid #9b87f5; padding: 20px; border-radius: 12px; margin: 30px 0;">
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0;">
          💡 <strong style="color: #ffffff;">Próximo passo:</strong> Crie sua conta e comece a gerar seu MVV profissional gratuitamente.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://maximaia.com.br/auth" 
           style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(155, 135, 245, 0.3);">
          Criar Minha Conta Agora
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
        Até breve,<br>
        <strong style="color: #ffffff;">Equipe Máxima iA</strong>
      </p>
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

    // 2. Enviar WhatsApp regionalizado (se telefone fornecido)
    if (phone) {
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

${name}, bem-vindo à *Máxima iA*! 🚀

Recebemos seu cadastro e já tá tudo certo pra você começar a transformar a cultura da sua empresa.

Agora é só criar sua conta e gerar seu *MVV profissional* gratuitamente!

🔗 Acesse: https://maximaia.com.br/auth

Qualquer dúvida, é só chamar!

*Equipe Máxima iA* 💜`;

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
