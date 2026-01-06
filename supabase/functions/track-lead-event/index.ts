import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadEventRequest {
  email: string;
  event_type: string;
  source?: string;
  metadata?: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, event_type, source, metadata }: LeadEventRequest = await req.json();

    if (!email || !event_type) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and event_type are required" }),
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

    // Validate event_type (whitelist allowed events)
    const allowedEvents = [
      "page_view",
      "signup_started",
      "signup_completed",
      "mvv_started",
      "mvv_completed",
      "culture_started",
      "culture_completed",
      "report_viewed",
      "checkout_started",
      "purchase_completed",
    ];

    if (!allowedEvents.includes(event_type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid event type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase.from("lead_events").insert({
      email,
      event_type,
      source: source || null,
      metadata: metadata || {},
    }).select().single();

    if (error) {
      console.error("Error tracking lead event:", error);
      throw error;
    }

    console.log(`✅ Lead event tracked: ${event_type} for ${email}`);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error tracking lead event:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
