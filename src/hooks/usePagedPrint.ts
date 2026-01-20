import { useCallback, useRef } from 'react';

/**
 * Hook para gerenciar impressão com Paged.js
 * Garante numeração correta de páginas físicas
 */
export function usePagedPrint() {
  const isPrintingRef = useRef(false);

  const handlePrint = useCallback(async () => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      // Importa Paged.js dinamicamente apenas quando necessário
      const { Previewer } = await import('pagedjs');
      
      // Cria um container temporário para o preview paginado
      const printArea = document.getElementById('print-content');
      if (!printArea) {
        console.error('Área de impressão não encontrada');
        window.print();
        return;
      }

      // Clona o conteúdo para não modificar o original
      const content = printArea.cloneNode(true) as HTMLElement;
      
      // Remove a classe que esconde no screen
      content.querySelectorAll('[class*="no-print"]').forEach(el => el.remove());
      
      // Cria container para o preview
      const previewContainer = document.createElement('div');
      previewContainer.id = 'paged-preview-container';
      previewContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: white; overflow: auto;';
      
      document.body.appendChild(previewContainer);
      document.body.style.overflow = 'hidden';

      // CSS para paginação
      const pagedStyles = `
        @page {
          size: A4 portrait;
          margin: 15mm 20mm 25mm 20mm;
        }
        
        @page:first {
          margin: 0;
        }
        
        @page cover {
          margin: 0;
        }
        
        .pagedjs_page {
          background: white !important;
        }
        
        .pagedjs_page_content {
          background: white !important;
        }
        
        /* Capa ocupa página inteira */
        .print-cover {
          page: cover;
          break-after: page;
          width: 210mm !important;
          min-height: 297mm;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%) !important;
        }
        
        .print-cover img {
          width: 80mm !important;
          height: auto !important;
          margin-bottom: 20mm;
        }
        
        .print-cover h1 {
          font-size: 32pt !important;
          color: white !important;
          text-align: center;
          margin-bottom: 8mm;
          font-weight: 800;
        }
        
        .print-cover .cover-meta {
          color: rgba(255,255,255,0.8) !important;
          font-size: 14pt;
          text-align: center;
        }
        
        .print-cover .cover-divider {
          width: 60mm;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          margin: 15mm 0;
        }
        
        .print-cover .cover-title {
          font-size: 18pt;
          color: #60a5fa !important;
          text-transform: uppercase;
          letter-spacing: 4pt;
          font-weight: 600;
        }
        
        /* Índice */
        .print-index {
          break-after: page;
        }
        
        .print-index h2 {
          font-size: 22pt;
          font-weight: 700;
          color: #1e3a8a !important;
          margin-bottom: 12pt;
          padding-bottom: 6pt;
          border-bottom: 3px solid #3b82f6;
        }
        
        .print-index-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .print-index-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 5pt 0;
          border-bottom: 1px dotted #d1d5db;
          font-size: 11pt;
          color: #374151 !important;
        }
        
        /* Seções de conteúdo */
        .print-section {
          break-before: page;
        }
        
        .print-section-header {
          display: flex;
          align-items: center;
          gap: 12pt;
          margin-bottom: 16pt;
          padding-bottom: 12pt;
          border-bottom: 3px solid #3b82f6;
        }
        
        .print-section-header .icon {
          font-size: 28pt;
        }
        
        .print-section-header h2 {
          font-size: 24pt;
          font-weight: 700;
          color: #1e3a8a !important;
          margin: 0;
        }
        
        .print-section h2 {
          font-size: 18pt;
          font-weight: 700;
          color: #1e3a8a !important;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 8pt;
          margin-bottom: 12pt;
        }
        
        .print-section h3 {
          font-size: 14pt;
          font-weight: 600;
          color: #1e40af !important;
          margin-top: 12pt;
          margin-bottom: 6pt;
        }
        
        .print-section p,
        .print-section li,
        .print-section td {
          font-size: 10pt;
          line-height: 1.6;
          color: #374151 !important;
        }
        
        .print-section table {
          width: 100%;
          border-collapse: collapse;
          margin: 8pt 0;
        }
        
        .print-section th,
        .print-section td {
          border: 1px solid #d1d5db;
          padding: 6pt;
        }
        
        .print-section th {
          background: #f3f4f6 !important;
          font-weight: 600;
          color: #1e3a8a !important;
        }
        
        /* Valores */
        .print-value {
          break-inside: avoid;
          margin-bottom: 12pt;
          padding: 12pt;
          background: #fafafa !important;
          border: 1px solid #e5e7eb;
          border-radius: 6pt;
        }
        
        .print-value h3 {
          font-size: 13pt;
          color: #1e3a8a !important;
          margin-top: 0 !important;
          margin-bottom: 6pt;
        }
        
        .print-value-description {
          font-size: 10pt;
          color: #4b5563 !important;
          margin-bottom: 12pt;
        }
        
        .print-value-mantra {
          font-size: 11pt;
          font-style: italic;
          color: #3b82f6 !important;
          padding: 10pt;
          background: white !important;
          border-left: 3px solid #3b82f6;
          margin: 0;
        }
        
        .print-vision-text {
          font-size: 14pt;
          line-height: 1.8;
          color: #1f2937 !important;
          font-style: italic;
          padding: 16pt;
          background: #f0f9ff !important;
          border-left: 4px solid #3b82f6;
          margin-bottom: 20pt;
        }
        
        /* Footer */
        .print-footer {
          break-before: page;
          min-height: 297mm;
          display: flex !important;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%) !important;
          padding: 40mm 20mm;
          text-align: center;
        }
        
        .print-footer h2 {
          font-size: 28pt;
          color: white !important;
          margin-bottom: 16pt;
        }
        
        .print-footer p {
          font-size: 14pt;
          color: rgba(255,255,255,0.8) !important;
          line-height: 1.8;
          max-width: 140mm;
        }
        
        .print-footer .footer-brand {
          margin-top: 30mm;
          padding-top: 20mm;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .print-footer .footer-brand p {
          font-size: 12pt;
          color: rgba(255,255,255,0.6) !important;
        }
      `;

      // Inicializa Paged.js
      const previewer = new Previewer();
      
      // Adiciona estilos de paginação
      const styleEl = document.createElement('style');
      styleEl.textContent = pagedStyles;
      content.prepend(styleEl);

      // Renderiza preview paginado
      await previewer.preview(content.innerHTML, [pagedStyles], previewContainer);

      // Adiciona botões de controle
      const controls = document.createElement('div');
      controls.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 100000; display: flex; gap: 10px;';
      controls.innerHTML = `
        <button id="paged-print-btn" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
          🖨️ Imprimir PDF
        </button>
        <button id="paged-close-btn" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
          ✕ Fechar
        </button>
      `;
      previewContainer.appendChild(controls);

      // Event listeners
      document.getElementById('paged-print-btn')?.addEventListener('click', () => {
        window.print();
      });

      document.getElementById('paged-close-btn')?.addEventListener('click', () => {
        previewContainer.remove();
        document.body.style.overflow = '';
        isPrintingRef.current = false;
      });

    } catch (error) {
      console.error('Erro ao preparar impressão com Paged.js:', error);
      // Fallback para impressão nativa
      window.print();
    } finally {
      isPrintingRef.current = false;
    }
  }, []);

  // Método simplificado que usa apenas CSS nativo otimizado
  const handleNativePrint = useCallback(() => {
    window.print();
  }, []);

  return { handlePrint, handleNativePrint };
}
