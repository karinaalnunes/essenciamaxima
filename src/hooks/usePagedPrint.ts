import { useCallback, useRef } from 'react';

/**
 * Hook para gerenciar impressão profissional com Paged.js
 * Garante numeração correta de páginas físicas e capa sem margens
 */
export function usePagedPrint() {
  const isPrintingRef = useRef(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const cleanup = useCallback(() => {
    if (previewContainerRef.current) {
      previewContainerRef.current.remove();
      previewContainerRef.current = null;
    }
    document.body.style.overflow = '';
    isPrintingRef.current = false;
  }, []);

  const handlePrint = useCallback(async (printContentId: string = 'print-content') => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      // Busca a área de impressão
      const printArea = document.getElementById(printContentId);
      if (!printArea) {
        console.error('Área de impressão não encontrada:', printContentId);
        window.print();
        isPrintingRef.current = false;
        return;
      }

      // Importa Paged.js dinamicamente
      const { Previewer } = await import('pagedjs');

      // Clona o conteúdo para não modificar o original
      const content = printArea.cloneNode(true) as HTMLElement;
      
      // Remove elementos que não devem ser impressos
      content.querySelectorAll('.no-print').forEach(el => el.remove());
      content.querySelectorAll('[class*="no-print"]').forEach(el => el.remove());

      // CSS completo para paginação profissional
      const pagedStyles = `
        /* ============================================
           CONFIGURAÇÃO DE PÁGINA A4
           ============================================ */
        @page {
          size: 210mm 297mm;
          margin: 18mm 15mm 25mm 15mm;
        }
        
        /* Capa: sem margens, sem numeração */
        @page cover {
          margin: 0;
        }
        
        /* Footer: sem margens, sem numeração */
        @page footer-page {
          margin: 0;
        }
        
        /* ============================================
           ESTILOS GLOBAIS PAGED.JS
           ============================================ */
        .pagedjs_page {
          background: white !important;
        }
        
        .pagedjs_page_content {
          background: white !important;
        }

        /* ============================================
           NUMERAÇÃO DE PÁGINAS
           ============================================ */
        .pagedjs_margin-bottom-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        
        .pagedjs_margin-bottom-right .pagedjs_margin-content::after {
          content: counter(page);
          font-size: 10pt;
          font-family: system-ui, -apple-system, sans-serif;
          color: #6b7280;
        }
        
        /* Esconder numeração na capa e footer */
        .pagedjs_named_page_cover .pagedjs_margin-bottom-right .pagedjs_margin-content::after,
        .pagedjs_named_page_footer-page .pagedjs_margin-bottom-right .pagedjs_margin-content::after {
          content: none !important;
        }

        /* ============================================
           CAPA - Página inteira sem margens
           ============================================ */
        .print-cover {
          page: cover;
          break-after: page;
          width: 210mm !important;
          min-height: 297mm;
          height: 297mm;
          margin: 0 !important;
          padding: 60mm 20mm 40mm 20mm;
          box-sizing: border-box;
          display: flex !important;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          position: relative;
        }
        
        .print-cover img {
          width: 70mm !important;
          height: auto !important;
          margin-bottom: 15mm;
        }
        
        .print-cover h1 {
          font-size: 28pt !important;
          color: white !important;
          text-align: center;
          margin: 0 0 6mm 0;
          font-weight: 800;
          line-height: 1.2;
        }
        
        .print-cover .cover-meta {
          color: rgba(255,255,255,0.8) !important;
          font-size: 12pt;
          text-align: center;
          line-height: 1.6;
        }
        
        .print-cover .cover-divider {
          width: 50mm;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          margin: 12mm 0;
        }
        
        .print-cover .cover-title {
          font-size: 14pt;
          color: #60a5fa !important;
          text-transform: uppercase;
          letter-spacing: 3pt;
          font-weight: 600;
          margin-bottom: 8mm;
        }

        /* ============================================
           ÍNDICE
           ============================================ */
        .print-index {
          break-after: page;
          padding: 0;
        }
        
        .print-index h2 {
          font-size: 20pt;
          font-weight: 700;
          color: #1e3a8a !important;
          margin-bottom: 14pt;
          padding-bottom: 8pt;
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
          padding: 6pt 0;
          border-bottom: 1px dotted #d1d5db;
          font-size: 10pt;
          color: #374151 !important;
        }
        
        .print-index-item .section-icon {
          margin-right: 8pt;
        }

        /* ============================================
           SEÇÕES DE CONTEÚDO
           ============================================ */
        .print-section {
          break-before: page;
          padding: 0;
        }
        
        .print-section-header {
          display: flex;
          align-items: center;
          gap: 12pt;
          margin-bottom: 18pt;
          padding-bottom: 12pt;
          border-bottom: 3px solid #3b82f6;
        }
        
        .print-section-header .icon {
          font-size: 26pt;
        }
        
        .print-section-header h2 {
          font-size: 22pt;
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
          margin-bottom: 14pt;
        }
        
        .print-section h3 {
          font-size: 13pt;
          font-weight: 600;
          color: #1e40af !important;
          margin-top: 14pt;
          margin-bottom: 6pt;
        }
        
        .print-section h4 {
          font-size: 11pt;
          font-weight: 600;
          color: #374151 !important;
          margin-top: 8pt;
          margin-bottom: 4pt;
        }
        
        .print-section p,
        .print-section li {
          font-size: 10pt;
          line-height: 1.6;
          color: #374151 !important;
        }

        /* ============================================
           TABELAS
           ============================================ */
        .print-section table {
          width: 100%;
          border-collapse: collapse;
          margin: 10pt 0;
          font-size: 8pt;
        }
        
        .print-section th,
        .print-section td {
          border: 1px solid #d1d5db;
          padding: 5pt 6pt;
          text-align: left;
          vertical-align: top;
        }
        
        .print-section th {
          background: #f3f4f6 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-weight: 600;
          color: #1e3a8a !important;
          white-space: nowrap;
        }
        
        .print-section td {
          color: #374151 !important;
        }

        /* ============================================
           VALORES
           ============================================ */
        .print-value {
          break-inside: avoid;
          margin-bottom: 14pt;
          padding: 12pt;
          background: #fafafa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border: 1px solid #e5e7eb;
          border-radius: 6pt;
        }
        
        .print-value h3 {
          font-size: 12pt;
          color: #1e3a8a !important;
          margin-top: 0 !important;
          margin-bottom: 6pt;
        }
        
        .print-value-description {
          font-size: 10pt;
          color: #4b5563 !important;
          margin-bottom: 10pt;
        }
        
        .print-value-mantra {
          font-size: 10pt;
          font-style: italic;
          color: #3b82f6 !important;
          padding: 8pt 10pt;
          background: white !important;
          border-left: 3px solid #3b82f6;
          margin: 0;
        }
        
        .print-vision-text {
          font-size: 13pt;
          line-height: 1.7;
          color: #1f2937 !important;
          font-style: italic;
          padding: 14pt;
          background: #f0f9ff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border-left: 4px solid #3b82f6;
          margin-bottom: 18pt;
        }

        /* ============================================
           PLANO DE AÇÃO
           ============================================ */
        .print-action-plan {
          break-inside: avoid;
          margin-bottom: 16pt;
        }
        
        .print-action-plan h4 {
          font-size: 12pt;
          font-weight: 700;
          color: #1e3a8a !important;
          margin-bottom: 8pt;
          padding: 6pt 10pt;
          background: #eff6ff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          border-radius: 4pt;
        }

        /* ============================================
           FOOTER - Página inteira
           ============================================ */
        .print-footer {
          page: footer-page;
          break-before: page;
          width: 210mm !important;
          min-height: 297mm;
          height: 297mm;
          margin: 0 !important;
          padding: 80mm 25mm 40mm 25mm;
          box-sizing: border-box;
          display: flex !important;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%) !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          text-align: center;
        }
        
        .print-footer h2 {
          font-size: 24pt;
          color: white !important;
          margin-bottom: 16pt;
          font-weight: 700;
          line-height: 1.3;
        }
        
        .print-footer p {
          font-size: 12pt;
          color: rgba(255,255,255,0.85) !important;
          line-height: 1.7;
          max-width: 150mm;
        }
        
        .print-footer .footer-brand {
          margin-top: 30mm;
          padding-top: 20mm;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .print-footer .footer-brand p {
          font-size: 10pt;
          color: rgba(255,255,255,0.6) !important;
        }

        /* ============================================
           UTILITÁRIOS
           ============================================ */
        .avoid-break {
          break-inside: avoid;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `;

      // Cria container para preview
      const previewContainer = document.createElement('div');
      previewContainer.id = 'paged-preview-container';
      previewContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 99999;
        background: #374151;
        overflow: auto;
        padding: 20px 0;
      `;
      
      previewContainerRef.current = previewContainer;
      document.body.appendChild(previewContainer);
      document.body.style.overflow = 'hidden';

      // Wrapper para o conteúdo paginado
      const contentWrapper = document.createElement('div');
      contentWrapper.id = 'paged-content-wrapper';
      contentWrapper.style.cssText = 'background: #374151; min-height: 100%;';
      previewContainer.appendChild(contentWrapper);

      // Inicializa Paged.js e renderiza
      const previewer = new Previewer();
      await previewer.preview(content.innerHTML, [pagedStyles], contentWrapper);

      // Adiciona botões de controle
      const controls = document.createElement('div');
      controls.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 100000;
        display: flex;
        gap: 12px;
        background: white;
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      controls.innerHTML = `
        <button id="paged-print-btn" style="
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.1s;
        ">
          <span style="font-size: 16px;">📄</span>
          Imprimir / Salvar PDF
        </button>
        <button id="paged-close-btn" style="
          padding: 10px 20px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.1s;
        ">
          <span style="font-size: 16px;">✕</span>
          Fechar
        </button>
      `;
      previewContainer.appendChild(controls);

      // Event listeners
      const printBtn = document.getElementById('paged-print-btn');
      const closeBtn = document.getElementById('paged-close-btn');
      
      printBtn?.addEventListener('click', () => {
        window.print();
      });
      
      printBtn?.addEventListener('mouseenter', () => {
        (printBtn as HTMLElement).style.transform = 'scale(1.02)';
      });
      printBtn?.addEventListener('mouseleave', () => {
        (printBtn as HTMLElement).style.transform = 'scale(1)';
      });

      closeBtn?.addEventListener('click', cleanup);
      closeBtn?.addEventListener('mouseenter', () => {
        (closeBtn as HTMLElement).style.transform = 'scale(1.02)';
      });
      closeBtn?.addEventListener('mouseleave', () => {
        (closeBtn as HTMLElement).style.transform = 'scale(1)';
      });

      // ESC para fechar
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);

    } catch (error) {
      console.error('Erro ao preparar impressão com Paged.js:', error);
      cleanup();
      // Fallback para impressão nativa
      window.print();
    }
  }, [cleanup]);

  // Método simplificado para impressão nativa
  const handleNativePrint = useCallback(() => {
    window.print();
  }, []);

  return { handlePrint, handleNativePrint, cleanup };
}
