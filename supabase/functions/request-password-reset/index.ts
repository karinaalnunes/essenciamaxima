import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  method: "email" | "whatsapp";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, method }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (!profile) {
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a reset code will be sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For WhatsApp, check if phone exists
    if (method === "whatsapp" && !profile.phone) {
      return new Response(
        JSON.stringify({ success: false, error: "No phone registered for this account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert reset code using service role
    const { error: codeError } = await supabase.from("password_reset_codes").insert({
      email,
      code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    if (codeError) {
      console.error("Error creating reset code:", codeError);
      throw codeError;
    }

    // Send the code via email or WhatsApp
    if (method === "email") {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b; margin-bottom: 24px;">Recuperação de Senha 🔐</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">Olá,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
            Você solicitou a recuperação de senha. Use o código abaixo:
          </p>
          <div style="background: #f3f4f6; padding: 24px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 24px 0;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">Código válido por 15 minutos.</p>
        </div>
      `;

      // Call send-email function
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email,
          subject: "🔐 Código de Recuperação de Senha - Máxima iA",
          html: emailHtml,
          type: "password_reset",
        }),
      });

      console.log(`✅ Password reset code sent via email to ${email}`);
    } else if (method === "whatsapp" && profile.phone) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          phone: profile.phone,
          message: `Seu código de recuperação de senha da Máxima iA: ${code}\n\nVálido por 15 minutos.`,
          type: "password_reset",
        }),
      });

      console.log(`✅ Password reset code sent via WhatsApp to ${profile.phone}`);
    }

    return new Response(
      JSON.stringify({ success: true, method }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in password reset request:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
