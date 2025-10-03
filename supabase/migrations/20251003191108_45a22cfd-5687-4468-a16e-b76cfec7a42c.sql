-- Adicionar coluna de telefone na tabela leads
-- Suporta formatos internacionais (países de língua portuguesa: Brasil, Portugal, Angola, Moçambique, etc.)
ALTER TABLE public.leads 
ADD COLUMN phone TEXT NOT NULL DEFAULT '';