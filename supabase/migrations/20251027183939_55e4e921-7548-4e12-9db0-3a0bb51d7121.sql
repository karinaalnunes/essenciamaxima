-- Adicionar campo subscription_plan na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'trial' 
CHECK (subscription_plan IN (
  'trial',
  'essencia_basica',
  'essencia_completa',
  'acompanhamento_grupo',
  'acompanhamento_individual',
  'consultoria_completa'
));