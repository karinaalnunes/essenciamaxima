import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationHistory, anamnesisData } = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    // Prepare conversation for AI
    const conversationText = conversationHistory
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const extractionPrompt = `Analise esta conversa completa do mapeamento de Cadeia de Valor e extraia TODOS os dados estruturados.

CONVERSA COMPLETA:
${conversationText}

CONTEXTO DA EMPRESA:
- Nome: ${anamnesisData.company_name}
- Segmento: ${anamnesisData.segment}
- Porte: ${anamnesisData.company_size || anamnesisData.employees_count + ' colaboradores'}

Extraia TODAS as atividades mapeadas (principais, apoio, terceirizadas e lacunas) com TODOS os detalhes coletados.`;

    // Tool calling para extrair estrutura
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em extrair dados estruturados de conversas sobre cadeia de valor empresarial.' },
          { role: 'user', content: extractionPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_value_chain_data",
              description: "Extrai dados estruturados da cadeia de valor",
              parameters: {
                type: "object",
                properties: {
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        type: { type: "string", enum: ["principal", "apoio", "terceirizada", "lacuna"] },
                        responsible: { type: "string" },
                        maturity: { type: "string", enum: ["estruturada", "improvisada", "caotica", "inexistente"] },
                        criticality: { type: "string", enum: ["critica", "importante", "desejavel"] },
                        concern: { type: "string", enum: ["sim", "nao", "as_vezes"] },
                        cost_range: { type: "string" },
                        cost_estimated: { type: "number" },
                        supplier: { type: "string" },
                        satisfaction: { type: "string", enum: ["alta", "media", "baixa"] },
                        gap_impact: { type: "string" },
                        gap_reason: { type: "string" },
                        value_score: { type: "number", minimum: 1, maximum: 5 },
                        cost_score: { type: "number", minimum: 1, maximum: 5 },
                        emotional_impact: {
                          type: "array",
                          items: { type: "string", enum: ["cansaco", "frustracao", "sobrecarga", "preocupacao"] }
                        }
                      },
                      required: ["name", "type", "maturity", "criticality"]
                    }
                  }
                },
                required: ["activities"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_value_chain_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI extraction error:', response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const activities = extractedData.activities;

    // Calculate quadrants and priorities
    activities.forEach((activity: any) => {
      // Calculate quadrant based on value_score and cost_score
      if (activity.value_score >= 4 && activity.cost_score <= 2) {
        activity.quadrant = 2; // Manter/Expandir
      } else if (activity.value_score >= 4 && activity.cost_score >= 4) {
        activity.quadrant = 1; // Otimizar
      } else if (activity.value_score <= 2 && activity.cost_score <= 2) {
        activity.quadrant = 3; // Observar
      } else if (activity.value_score <= 2 && activity.cost_score >= 4) {
        activity.quadrant = 4; // Reduzir/Terceirizar
      } else {
        activity.quadrant = 3; // Default
      }

      // Calculate priority
      const isCritical = activity.criticality === 'critica';
      const isChaotic = activity.maturity === 'caotica' || activity.maturity === 'inexistente';
      const hasEmotionalImpact = activity.emotional_impact && activity.emotional_impact.length > 0;

      if (isCritical && isChaotic && hasEmotionalImpact) {
        activity.priority = 'urgente';
      } else if (activity.criticality === 'importante' || activity.maturity === 'improvisada' || activity.quadrant === 1) {
        activity.priority = 'importante';
      } else {
        activity.priority = 'desejavel';
      }
    });

    // Calculate summaries
    const maturityCounts = {
      estruturadas: activities.filter((a: any) => a.maturity === 'estruturada').length,
      improvisadas: activities.filter((a: any) => a.maturity === 'improvisada').length,
      caoticas: activities.filter((a: any) => a.maturity === 'caotica').length,
      inexistentes: activities.filter((a: any) => a.maturity === 'inexistente').length,
    };

    const total = activities.length;
    const maturity_summary = {
      estruturadas: {
        count: maturityCounts.estruturadas,
        percentage: Math.round((maturityCounts.estruturadas / total) * 100),
        list: activities.filter((a: any) => a.maturity === 'estruturada').map((a: any) => a.name)
      },
      improvisadas: {
        count: maturityCounts.improvisadas,
        percentage: Math.round((maturityCounts.improvisadas / total) * 100),
        list: activities.filter((a: any) => a.maturity === 'improvisada').map((a: any) => a.name)
      },
      caoticas: {
        count: maturityCounts.caoticas,
        percentage: Math.round((maturityCounts.caoticas / total) * 100),
        list: activities.filter((a: any) => a.maturity === 'caotica').map((a: any) => a.name)
      },
      inexistentes: {
        count: maturityCounts.inexistentes,
        percentage: Math.round((maturityCounts.inexistentes / total) * 100),
        list: activities.filter((a: any) => a.maturity === 'inexistente').map((a: any) => a.name)
      }
    };

    // Calculate investment summary
    const principalCost = activities
      .filter((a: any) => a.type === 'principal')
      .reduce((sum: number, a: any) => sum + (a.cost_estimated || 0), 0);
    
    const apoioCost = activities
      .filter((a: any) => a.type === 'apoio')
      .reduce((sum: number, a: any) => sum + (a.cost_estimated || 0), 0);
    
    const terceirizadoCost = activities
      .filter((a: any) => a.type === 'terceirizada')
      .reduce((sum: number, a: any) => sum + (a.cost_estimated || 0), 0);
    
    const totalCost = principalCost + apoioCost + terceirizadoCost;

    const investment_summary = {
      total_estimated: totalCost,
      by_category: {
        principais: {
          amount: principalCost,
          percentage: totalCost > 0 ? Math.round((principalCost / totalCost) * 100) : 0
        },
        apoio: {
          amount: apoioCost,
          percentage: totalCost > 0 ? Math.round((apoioCost / totalCost) * 100) : 0
        },
        terceirizados: {
          amount: terceirizadoCost,
          percentage: totalCost > 0 ? Math.round((terceirizadoCost / totalCost) * 100) : 0
        }
      }
    };

    // Emotional summary
    const emotional_summary = {
      cansam: activities.filter((a: any) => a.emotional_impact?.includes('cansaco')).map((a: any) => a.name),
      frustram: activities.filter((a: any) => a.emotional_impact?.includes('frustracao')).map((a: any) => a.name),
      sobrecarregam: activities.filter((a: any) => a.emotional_impact?.includes('sobrecarga')).map((a: any) => a.name),
      preocupam: activities.filter((a: any) => a.emotional_impact?.includes('preocupacao')).map((a: any) => a.name)
    };

    // Value matrix by quadrant
    const value_matrix = {
      quadrant1_otimizar: activities.filter((a: any) => a.quadrant === 1),
      quadrant2_manter: activities.filter((a: any) => a.quadrant === 2),
      quadrant3_observar: activities.filter((a: any) => a.quadrant === 3),
      quadrant4_reduzir: activities.filter((a: any) => a.quadrant === 4)
    };

    // Top priorities (top 5 urgent activities)
    const top_priorities = activities
      .filter((a: any) => a.priority === 'urgente')
      .slice(0, 5)
      .map((a: any) => ({
        activity: a.name,
        deadline_days: 30,
        investment: a.cost_range || 'A definir',
        expected_result: `Estruturar ${a.name} e reduzir impacto emocional`,
        why_priority: `Criticidade ${a.criticality}, maturidade ${a.maturity}, impacto emocional detectado`
      }));

    const reportData = {
      success: true,
      data: {
        activities,
        maturity_summary,
        investment_summary,
        emotional_summary,
        value_matrix,
        top_priorities
      }
    };

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate value chain report error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
