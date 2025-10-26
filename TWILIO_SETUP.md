# Configuração do Twilio WhatsApp

## 1. Criar conta Twilio
- Acesse: https://www.twilio.com/try-twilio
- Crie conta gratuita ($15 de crédito inicial)

## 2. Configurar WhatsApp Business
- Dashboard → Messaging → Try it Out → Send a WhatsApp message
- Siga o wizard para conectar seu número de WhatsApp Business
- Valide o número

## 3. Obter credenciais
- **Account SID**: Disponível no Dashboard principal
- **Auth Token**: Dashboard → Settings → API Credentials (clique em "Show")
- **WhatsApp Number**: Messaging → WhatsApp senders (formato: +14155238886)

## 4. Adicionar secrets no Lovable
Via interface de Secrets do Lovable:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`

## 5. Testar envio
Após adicionar as credenciais, o sistema automaticamente começará a enviar mensagens via WhatsApp.

Você pode verificar os logs em: **Admin → Comunicação**

## Observações importantes

### Limitações da conta gratuita Twilio
- Apenas números pré-aprovados podem receber mensagens
- Template de mensagem limitado
- $15 de crédito inicial

### Para produção
- Valide seu domínio de envio
- Configure templates de mensagem aprovados pela Meta
- Upgrade para conta paga para remover limitações

## Solução de problemas

### Erro: "Unauthorized"
- Verifique se o Account SID e Auth Token estão corretos
- Certifique-se de que não há espaços extras nas credenciais

### Erro: "Invalid phone number"
- Use formato internacional: +5511987654321
- Remova espaços, parênteses e hífens

### Mensagens não são entregues
- Verifique se o número está no formato correto
- Para contas Trial, adicione o número na lista de números autorizados
- Verifique o saldo da conta Twilio
