import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadRequest {
  name: string;
  email: string;
  phone: string;
  company: string;
  segment: string;
  consent_lgpd: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  browser?: string;
  os?: string;
  device?: string;
  language?: string;
  screen_resolution?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  referrer?: string;
  time_on_page?: number;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData: LeadRequest = await req.json();

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.phone || !leadData.company || !leadData.segment) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate LGPD consent
    if (!leadData.consent_lgpd) {
      return new Response(
        JSON.stringify({ success: false, error: "LGPD consent required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone (minimum 10 digits)
    const phoneDigits = leadData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert lead using service role
    const { data, error } = await supabase.from("leads").insert({
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      company: leadData.company,
      segment: leadData.segment,
      consent_lgpd: leadData.consent_lgpd,
      utm_source: leadData.utm_source || null,
      utm_medium: leadData.utm_medium || null,
      utm_campaign: leadData.utm_campaign || null,
      browser: leadData.browser || null,
      os: leadData.os || null,
      device: leadData.device || null,
      language: leadData.language || null,
      screen_resolution: leadData.screen_resolution || null,
      city: leadData.city || null,
      state: leadData.state || null,
      country: leadData.country || null,
      timezone: leadData.timezone || null,
      referrer: leadData.referrer || null,
      time_on_page: leadData.time_on_page || null,
      gclid: leadData.gclid || null,
      fbclid: leadData.fbclid || null,
      landing_page: leadData.landing_page || null,
    }).select().single();

    if (error) {
      console.error("Error inserting lead:", error);
      throw error;
    }

    console.log(`✅ Lead captured: ${leadData.email}`);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error capturing lead:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
