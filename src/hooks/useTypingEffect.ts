import { useState, useEffect, useRef } from 'react';

export const useTypingEffect = (speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const targetTextRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = (text: string) => {
    targetTextRef.current = text;
    setIsTyping(true);
  };

  useEffect(() => {
    if (!isTyping) return;

    const currentLength = displayedText.length;
    const targetLength = targetTextRef.current.length;

    if (currentLength < targetLength) {
      // Pega próximos 1-3 caracteres (buffer variável para simular digitação humana)
      const chunkSize = Math.min(
        Math.floor(Math.random() * 3) + 1,
        targetLength - currentLength
      );
      
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(targetTextRef.current.slice(0, currentLength + chunkSize));
      }, speed);
    } else {
      setIsTyping(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayedText, isTyping, speed]);

  const reset = () => {
    setDisplayedText('');
    setIsTyping(false);
    targetTextRef.current = '';
  };

  return { displayedText, startTyping, isTyping, reset };
};
