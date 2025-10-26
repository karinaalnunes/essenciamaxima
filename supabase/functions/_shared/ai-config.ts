// Configuração centralizada para providers de IA
// Facilita migração entre Lovable AI, OpenAI, Anthropic, etc.

export interface AIConfig {
  provider: 'lovable' | 'openai' | 'anthropic';
  endpoint: string;
  model: string;
  apiKeyEnv: string;
}

export const AI_CONFIGS: Record<string, AIConfig> = {
  mvv: {
    provider: 'lovable',
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    model: 'google/gemini-2.5-flash',
    apiKeyEnv: 'LOVABLE_API_KEY',
  },
  cultura: {
    provider: 'lovable',
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    model: 'google/gemini-2.5-flash',
    apiKeyEnv: 'LOVABLE_API_KEY',
  },
};

export function getAIConfig(module: 'mvv' | 'cultura'): AIConfig {
  return AI_CONFIGS[module];
}

// Função auxiliar para estimar tokens (1 token ≈ 4 caracteres)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
