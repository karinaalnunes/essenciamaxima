import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig, estimateTokens } from "../_shared/ai-config.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { conversationHistory, functionContext } = await req.json();
    
    console.log('📊 Generate process report request', {
      conversationLength: conversationHistory?.length,
      hasFunctionContext: !!functionContext
    });

    const aiConfig = getAIConfig('cultura');
    const apiKey = Deno.env.get(aiConfig.apiKeyEnv);

    if (!apiKey) {
      throw new Error(`${aiConfig.apiKeyEnv} not configured`);
    }

    // Build comprehensive conversation context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `Com base na conversa completa de mapeamento de processos, gere um relatório estruturado em JSON.

**CONVERSA COMPLETA:**
${conversationContext}

${functionContext ? `\n**CONTEXTO DA FUNÇÃO:**\n${functionContext}\n` : ''}

**INSTRUÇÕES CRÍTICAS:**

1. Analise TODO o histórico da conversa para extrair TODOS os processos mapeados
2. Para cada processo mencionado, organize as informações em estrutura completa
3. Se alguma informação não foi fornecida, deixe o campo vazio ou null
4. Mantenha fidelidade total às informações fornecidas pelo usuário
5. Identifique oportunidades de melhoria mencionadas na conversa

**ESTRUTURA JSON OBRIGATÓRIA:**

{
  "function_name": "Nome da função ou área mapeada",
  "function_description": "Descrição breve do contexto",
  "has_function_descriptor": boolean,
  "processes": [
    {
      "process_name": "Nome do processo",
      "objective": "Para que serve este processo",
      "responsible": "Quem executa",
      "frequency": "Com que frequência (diária/semanal/mensal)",
      "average_time": "Tempo médio de execução",
      "max_time": "Tempo máximo aceitável",
      "complexity": "simples|medium|complex",
      "criticality": "low|medium|high",
      "inputs": [
        {
          "type": "information|document|access|resource",
          "description": "Descrição do input",
          "source": "De onde vem"
        }
      ],
      "outputs": [
        {
          "description": "O que é entregue",
          "destination": "Para quem/onde vai",
          "format": "Formato da entrega"
        }
      ],
      "steps": [
        {
          "step_number": 1,
          "description": "Descrição detalhada da etapa",
          "responsible": "Quem executa",
          "system_tool": "Sistema ou ferramenta usada",
          "input": "O que precisa",
          "output": "O que gera",
          "decision_point": "Descrição se houver decisão",
          "exception_handling": "Como tratar exceções",
          "estimated_time": "Tempo estimado",
          "requires_screenshot": boolean,
          "screenshot_instructions": "O que capturar e destacar"
        }
      ],
      "dependencies": [
        {
          "type": "before|after",
          "area_person": "Área ou pessoa",
          "description": "O que precisam fazer",
          "communication_method": "Como se comunicam"
        }
      ],
      "kpis": [
        {
          "name": "Nome do indicador",
          "target": "Meta esperada",
          "measurement_method": "Como medir"
        }
      ],
      "resources_needed": {
        "systems": [
          {
            "name": "Nome do sistema",
            "url": "URL ou localização",
            "access_type": "Tipo de acesso necessário",
            "responsible_for_access": "Quem libera acesso"
          }
        ],
        "documents": [
          {
            "name": "Nome do documento",
            "location": "Caminho completo",
            "format": "Formato do arquivo",
            "notes": "Quando/como usar"
          }
        ],
        "physical_equipment": ["Lista de equipamentos físicos"],
        "prior_knowledge": ["O que pessoa precisa saber antes"]
      },
      "common_errors": [
        {
          "error": "Descrição do erro comum",
          "frequency": "Frequência estimada",
          "cause": "Causa raiz",
          "prevention": "Como prevenir"
        }
      ],
      "improvement_opportunities": [
        {
          "type": "bottleneck|rework|waste|automation",
          "description": "Descrição da oportunidade",
          "current_impact": "Impacto atual",
          "suggested_solution": "Solução sugerida",
          "priority": "high|medium|low",
          "estimated_effort": "high|medium|low"
        }
      ],
      "flowchart_data": {
        "nodes": [
          {
            "id": "node_id",
            "type": "start|end|step|decision|subprocess",
            "label": "Texto do nó",
            "description": "Descrição detalhada"
          }
        ],
        "edges": [
          {
            "from": "node_id",
            "to": "node_id",
            "label": "SIM|NÃO|ou vazio",
            "condition": "Condição se aplicável"
          }
        ]
      }
    }
  ],
  "overall_analysis": {
    "total_processes_mapped": 0,
    "total_estimated_time": "Soma dos tempos",
    "critical_processes_count": 0,
    "main_bottlenecks": ["Lista de gargalos principais"],
    "automation_potential": ["Processos com potencial de automação"],
    "priority_improvements": [
      {
        "improvement": "Descrição",
        "impact": "high|medium|low",
        "effort": "high|medium|low"
      }
    ]
  }
}

**REGRAS FINAIS:**
- Todo campo deve ser preenchido com informações da conversa ou deixado vazio/null
- Mantenha fidelidade absoluta ao que foi dito
- Se usuário não forneceu algo, não invente
- Organize cronologicamente os steps
- Identifique todos os pontos de decisão mencionados
- Capture todas as oportunidades de melhoria discutidas

Retorne APENAS o JSON, sem texto adicional, sem markdown, sem explicações.`;

    console.log('🤖 Calling AI to generate process report');
    console.log('📊 Estimated input tokens:', estimateTokens(prompt));

    const response = await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: "system",
            content: "Você é um assistente especializado em estruturar dados de processos empresariais em JSON. Retorne APENAS JSON válido, sem markdown, sem explicações."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('✅ AI response received');
    console.log('📊 Response length:', generatedText.length);

    // Clean up the response - remove markdown code blocks if present
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let processData;
    try {
      processData = JSON.parse(cleanedText);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      console.error('Generated text:', cleanedText.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    // Log usage metrics
    const latencyMs = Date.now() - startTime;
    const tokensInput = data.usage?.prompt_tokens || estimateTokens(prompt);
    const tokensOutput = data.usage?.completion_tokens || estimateTokens(generatedText);

    console.log('📊 Generation metrics:', {
      latencyMs,
      tokensInput,
      tokensOutput,
      model: aiConfig.model,
      processesCount: processData.processes?.length || 0
    });

    // Log to ai_usage_logs
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('ai_usage_logs').insert({
        module: 'processos',
        function_name: 'generate-process-report',
        model: aiConfig.model,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        latency_ms: latencyMs,
        status: 'success',
      });
    } catch (logError) {
      console.error('⚠️ Failed to log AI usage:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: processData,
        metadata: {
          tokensInput,
          tokensOutput,
          latencyMs,
          model: aiConfig.model
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Generate report error:', error);
    
    // Log error to ai_usage_logs
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('ai_usage_logs').insert({
          module: 'processos',
          function_name: 'generate-process-report',
          model: 'unknown',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          latency_ms: Date.now() - startTime,
        });
      }
    } catch (logError) {
      console.error('⚠️ Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate process report'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
