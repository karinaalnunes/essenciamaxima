import { useCallback, useRef } from 'react';

/**
 * Hook para impressão profissional usando CSS @media print
 * Sem preview intermediário - abre diálogo de impressão direto
 */
export function usePagedPrint() {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(async (printContentId: string = 'print-content') => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      // Abre diálogo de impressão nativo
      window.print();
    } finally {
      isPrintingRef.current = false;
    }
  }, []);

  const handleNativePrint = useCallback(() => {
    window.print();
  }, []);

  const cleanup = useCallback(() => {
    isPrintingRef.current = false;
  }, []);

  return { handlePrint, handleNativePrint, cleanup };
}
