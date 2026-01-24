
# Plano: Corrigir Loop Infinito na Consultoria MVV

## Problema Identificado

O cliente está experimentando um "looping" na página de Consultoria MVV. A causa raiz está no processamento do streaming de mensagens do chat:

### 1. Múltiplas chamadas de `startTyping` durante streaming
```typescript
// Linha 507 - chamado a cada token recebido (centenas de vezes!)
startTyping(assistantContent);
```
Isso causa o hook `useTypingEffect` a resetar seu estado interno continuamente, criando re-renders infinitos.

### 2. Mutação direta de estado
```typescript
// Linha 501 - mutando diretamente o objeto ao invés de criar cópia
lastMsg.content = assistantContent;
```
Isso viola os princípios de imutabilidade do React e pode causar comportamentos inesperados.

### 3. Hook useTypingEffect mal projetado para streaming
O hook foi projetado para "digitar" texto completo, não para acompanhar texto que cresce token por token durante streaming SSE.

---

## Solução

### Arquivo: `src/pages/NovoMVV.tsx`

**Mudança 1: Remover o efeito de digitação durante streaming**

O streaming de tokens já cria um efeito visual de "digitação" natural. Usar um hook adicional de typing effect é redundante e causa o loop.

```typescript
// REMOVER estas linhas durante o processamento de stream:
startTyping(assistantContent);  // Linha 507
startTyping(assistantContent);  // Linha 536 (no flush do buffer)

// E remover o uso do displayedText no render:
// DE:
content={isLastAssistant ? displayedText : msg.content}

// PARA:
content={msg.content}
```

**Mudança 2: Corrigir mutação de estado para imutabilidade**

```typescript
// DE (mutação direta):
setMessages((prev) => {
  const newMessages = [...prev];
  const lastMsg = newMessages[newMessages.length - 1];
  if (lastMsg?.role === "assistant") {
    lastMsg.content = assistantContent;  // MUTAÇÃO DIRETA!
  }
  return newMessages;
});

// PARA (cópia imutável):
setMessages((prev) => 
  prev.map((msg, i) => 
    i === prev.length - 1 && msg.role === 'assistant'
      ? { ...msg, content: assistantContent }
      : msg
  )
);
```

**Mudança 3: Remover import e uso do useTypingEffect (opcional se não usado em outro lugar)**

Se o hook não for mais necessário neste componente:
```typescript
// Remover:
import { useTypingEffect } from "@/hooks/useTypingEffect";
const { displayedText, startTyping, isTyping } = useTypingEffect(20);

// Remover verificação do isTyping no render:
const isLastAssistant = 
  index === messages.length - 1 && 
  msg.role === 'assistant' && 
  isTyping;  // Remover esta condição
```

---

## Resumo das Mudanças

| Arquivo | Linha(s) | Mudança |
|---------|----------|---------|
| `src/pages/NovoMVV.tsx` | 11, 57 | Remover import e uso do `useTypingEffect` |
| `src/pages/NovoMVV.tsx` | 497-504 | Corrigir mutação de estado para imutabilidade |
| `src/pages/NovoMVV.tsx` | 507, 536 | Remover chamadas de `startTyping` |
| `src/pages/NovoMVV.tsx` | 711-714 | Remover lógica de `isLastAssistant` e usar `msg.content` direto |
| `src/pages/NovoMVV.tsx` | 723 | Usar `content={msg.content}` ao invés de `displayedText` |

---

## Resultado Esperado

- Chat funcionará sem looping
- Streaming de tokens aparecerá naturalmente (já tem efeito de "digitação" pelo próprio streaming)
- Menos re-renders = melhor performance
- Código mais simples e robusto

---

## Detalhes Técnicos

O problema específico acontece porque:

1. **SSE (Server-Sent Events)** envia tokens um a um
2. Cada token dispara `setMessages` + `startTyping`
3. `startTyping` seta `isTyping = true` e atualiza `targetTextRef`
4. O `useEffect` no hook tenta "digitar" caractere por caractere
5. Mas antes de terminar, outro token chega e reinicia o processo
6. Isso cria uma espiral de re-renders

A solução é confiar no streaming nativo para o efeito visual e remover a camada extra de animação.
