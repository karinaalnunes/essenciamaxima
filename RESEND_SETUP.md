# Configuração do Resend

## 1. Criar conta
- Acesse: https://resend.com/signup
- Crie conta gratuita (3.000 emails/mês grátis)

## 2. Validar domínio (IMPORTANTE)
- Dashboard → Domains → Add Domain
- Adicione seu domínio (ex: maximaia.com.br)
- Configure os registros DNS necessários:
  - **SPF**: Registro TXT para verificação de remetente
  - **DKIM**: Chaves de autenticação de domínio
  - **DMARC**: Política de autenticação (opcional mas recomendado)

**Importante**: A validação do domínio pode levar até 48 horas. Enquanto isso, você pode usar o domínio padrão `onboarding@resend.dev` para testes.

## 3. Criar API Key
- Dashboard → API Keys → Create API Key
- Nome sugerido: "Máxima iA Production"
- Permissões: Sending access
- **Copie a chave imediatamente** (ela só aparece uma vez!)

## 4. Adicionar secret no Lovable
Via interface de Secrets do Lovable:
- Nome: `RESEND_API_KEY`
- Valor: Cole a API key copiada no passo anterior

## 5. Configurar remetente padrão
Após validar o domínio, edite a edge function `send-email/index.ts`:

```typescript
from: "Máxima iA <contato@maximaia.com.br>", // Substitua pelo seu domínio
```

## 6. Testar envio
Teste enviando um email de boas-vindas através do sistema ou via Admin → Comunicação.

## Boas práticas

### Para melhor entregabilidade
1. **Use seu próprio domínio**: Emails de domínios verificados têm maior taxa de entrega
2. **Configure SPF e DKIM**: Essencial para evitar spam
3. **Warm-up do domínio**: Comece enviando poucos emails e aumente gradualmente
4. **Monitore bounces**: Remova emails inválidos da lista

### Templates de email
- Use HTML responsivo
- Teste em diferentes clientes de email
- Inclua versão em texto plano
- Adicione link de descadastramento (unsubscribe)

### Monitoramento
- Dashboard do Resend mostra:
  - Emails enviados vs entregues
  - Taxa de abertura (se configurado)
  - Bounces e reclamações de spam
  - Logs detalhados de cada envio

## Limites e custos

### Plano gratuito
- 3.000 emails/mês
- 100 emails/dia
- Todos os recursos básicos

### Planos pagos
- A partir de $20/mês
- 50.000 emails/mês
- Volumes maiores disponíveis
- Suporte prioritário

## Solução de problemas

### Erro: "Invalid API Key"
- Verifique se a chave foi copiada corretamente
- Confirme que não há espaços extras
- Gere uma nova chave se necessário

### Emails caem em spam
- Valide SPF e DKIM no domínio
- Evite palavras-gatilho (grátis, promoção, etc)
- Não use CAPS excessivo no assunto
- Mantenha boa proporção texto/imagem

### Domínio não valida
- Aguarde até 48h para propagação DNS
- Verifique se os registros DNS estão corretos
- Use ferramentas como MXToolbox para testar

### Rate limit excedido
- Você atingiu o limite diário/mensal
- Upgrade para plano pago
- Distribua envios ao longo do tempo
