import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAIConfig, estimateTokens } from '../_shared/ai-config.ts';

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
    const { conversationHistory, mvvData } = await req.json();

    const aiConfig = getAIConfig('cultura');
    const AI_API_KEY = Deno.env.get(aiConfig.apiKeyEnv);

    const prompt = `Com base na conversa completa do Código de Cultura Máxima e no MVV existente abaixo, extraia e estruture o Código de Cultura completo da empresa.

CONVERSA COMPLETA:
${conversationHistory}

MVV EXISTENTE:
Empresa: ${mvvData.company_name}
Segmento: ${mvvData.segment}
Visão: ${mvvData.vision || 'N/A'}
Missão: ${mvvData.mission || 'N/A'}
Valores: ${mvvData.values ? JSON.stringify(mvvData.values) : 'N/A'}

IMPORTANTE: Analise TODA a conversa com atenção e extraia TODAS as informações relevantes mencionadas pelo cliente.

Retorne um JSON válido com EXATAMENTE esta estrutura (sem markdown, sem \`\`\`json):

{
  "reputation_goal": "Como a empresa quer ser reconhecida no futuro",
  "competitive_advantage": "O que torna a empresa diferente dos concorrentes",
  "swot_strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "swot_improvements": ["Melhoria necessária 1", "Melhoria necessária 2"],
  
  "guiding_principles": [
    "Princípio norteador 1 (regra de ouro)",
    "Princípio norteador 2 (regra de ouro)",
    "Princípio norteador 3 (regra de ouro)"
  ],
  
  "growth_practices": "Como a empresa incentiva crescimento e desenvolvimento da equipe",
  "wellbeing_support": "Como a empresa apoia o bem-estar físico, mental, emocional e espiritual",
  "psychological_safety_practices": "Práticas de segurança psicológica (NR-1) implementadas",
  
  "cultural_rituals": [
    {
      "name": "Nome do ritual 1",
      "description": "Descrição completa do ritual"
    },
    {
      "name": "Nome do ritual 2",
      "description": "Descrição completa do ritual"
    }
  ],
  
  "stakeholder_guidelines": {
    "colaboradores": "Como a empresa se relaciona com colaboradores",
    "clientes": "Como a empresa se relaciona com clientes",
    "fornecedores": "Como a empresa se relaciona com fornecedores",
    "parceiros": "Como a empresa se relaciona com parceiros",
    "comunidade": "Como a empresa se relaciona com a comunidade"
  },
  
  "culture_indicators": [
    {
      "name": "Nome do indicador 1",
      "metric": "Como será medido (ex: NPS interno, turnover, etc)",
      "target": "Meta ou objetivo do indicador"
    }
  ],
  
  "action_plan_30": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável (cargo genérico)",
      "when": "Quando - data ou marco",
      "where": "Onde - departamento/local/sistema",
      "how": "Como será executado",
      "how_much": "Quanto custará - faixas de investimento em dinheiro ou tempo"
    }
  ],
  "action_plan_60": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável",
      "when": "Quando",
      "where": "Onde",
      "how": "Como",
      "how_much": "Custo/tempo"
    }
  ],
  "action_plan_90": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável",
      "when": "Quando",
      "where": "Onde",
      "how": "Como",
      "how_much": "Custo/tempo"
    }
  ],
  "action_plan_120": [
    {
      "what": "O que será feito",
      "why": "Por que / objetivo",
      "who": "Quem será responsável",
      "when": "Quando",
      "where": "Onde",
      "how": "Como",
      "how_much": "Custo/tempo"
    }
  ],
  
  "cultural_essence": "Síntese da identidade cultural: o que move, inspira e diferencia a empresa (2-3 parágrafos)",
  "cultural_strengths": [
    "Ponto forte 1 da cultura atual",
    "Ponto forte 2 da cultura atual",
    "Ponto forte 3 da cultura atual"
  ],
  "cultural_challenges": [
    "Desafio cultural 1 a endereçar",
    "Desafio cultural 2 a endereçar",
    "Desafio cultural 3 a endereçar"
  ],
  "strategic_focus": "2-3 prioridades práticas ligadas ao Plano SMART para os próximos 90 dias",
  "closing_message": "Mensagem inspiradora de encerramento (2-3 parágrafos)"
}

REGRAS CRÍTICAS:
1. Retorne APENAS o JSON, sem texto adicional antes ou depois
2. Não use markdown (\`\`\`json)
3. Use TODAS as informações da conversa
4. Se alguma informação não foi mencionada, use null ou array vazio []
5. Mantenha o tom inspirador mas profissional
6. Princípios norteadores: 3-5 regras de ouro
7. Cada período do plano de ação (30/60/90/120) deve ter 3-5 ações
8. Indicadores de cultura: pelo menos 3-5 indicadores práticos
9. Extraia TODOS os rituais mencionados na conversa
10. Conecte tudo ao MVV existente da empresa`;

    const response = await fetch(aiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CULTURA] AI API Error:', response.status, errorText);
      throw new Error('AI API error');
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content.trim();

    // Clean up markdown if present
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated Culture Report:', generatedText);

    const cultureData = JSON.parse(generatedText);

    // Log usage (note: no user_id available in this function)
    console.log('[CULTURA] Usage:', {
      module: 'cultura',
      function: 'generate-culture-report',
      tokens_input: estimateTokens(prompt),
      tokens_output: estimateTokens(generatedText),
      latency: Date.now() - startTime
    });

    return new Response(
      JSON.stringify(cultureData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-culture-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
