import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Loads the active system prompt for a given assistant from the database.
 * Falls back to a provided default prompt if the database lookup fails.
 */
export async function loadActivePrompt(
  assistantKey: string, 
  fallbackPrompt: string
): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn(`[${assistantKey}] Missing Supabase credentials, using fallback prompt`);
      return fallbackPrompt;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('assistant_prompts')
      .select('system_prompt')
      .eq('assistant_key', assistantKey)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error(`[${assistantKey}] Error loading prompt from database:`, error);
      return fallbackPrompt;
    }

    if (!data?.system_prompt) {
      console.warn(`[${assistantKey}] No active prompt found in database, using fallback`);
      return fallbackPrompt;
    }

    console.log(`[${assistantKey}] Loaded active prompt from database (${data.system_prompt.length} chars)`);
    return data.system_prompt;
  } catch (error) {
    console.error(`[${assistantKey}] Exception loading prompt:`, error);
    return fallbackPrompt;
  }
}
