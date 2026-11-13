import React from 'react';

/**
 * Componente de Cabeçalho Executivo exclusivo para Impressão e Exportação em PDF (US-022 / US-023)
 * Oculto na visualização de tela normal e exibido no topo da página ao disparar window.print().
 */
function formatarDataEmissao() {
  const agora = new Date();
  return agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function PrintHeader({ titulo, subtitulo, periodo }) {
  const dataHoraEmissao = React.useMemo(() => formatarDataEmissao(), []);

  return (
    <div className="print-executive-header">
      <div className="print-header-top">
        <div className="print-brand">
          <div className="print-brand-badge">BENNER</div>
          <div className="print-brand-info">
            <span className="print-brand-title">Controle & Mapa de Alocação</span>
            <span className="print-brand-sub">Sistema de Gestão de Capacidade e Recursos</span>
          </div>
        </div>

        <div className="print-meta">
          <div><strong>Emissão:</strong> {dataHoraEmissao}</div>
          {periodo && <div><strong>Período:</strong> {periodo}</div>}
        </div>
      </div>

      <div className="print-report-title-box">
        <h1 className="print-report-title">{titulo || 'Relatório de Alocação de Programadores'}</h1>
        {subtitulo && <p className="print-report-sub">{subtitulo}</p>}
      </div>
    </div>
  );
}
