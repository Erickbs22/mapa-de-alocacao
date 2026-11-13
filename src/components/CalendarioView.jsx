import React, { useState, useMemo } from 'react';
import PrintHeader from './PrintHeader';

export default function CalendarioView({ 
  alocacoes, 
  programadores, 
  projetos, 
  ausencias = [],
  usuarioLogado = null,
  contarFinaisDeSemana = false,
  onCriarAlocacao,
  onEditarAlocacao,
  onMoverAlocacao,
  onAbrirAusencia
}) {
  const isDesenvolvedor = usuarioLogado?.perfil === 'desenvolvedor';

  // Nível de Zoom no Calendário: 'compacto', 'normal', 'expandido'
  const [zoomCal, setZoomCal] = useState(() => {
    try {
      return localStorage.getItem('cal_zoom') || 'normal';
    } catch {
      return 'normal';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('cal_zoom', zoomCal);
    } catch (e) {
      console.error('Erro ao salvar preferência de zoom do calendário:', e);
    }
  }, [zoomCal]);
  const [dataAtual, setDataAtual] = useState(() => new Date());
  const [filtroProgramador, setFiltroProgramador] = useState('');
  const [filtroProjeto, setFiltroProjeto] = useState('');

  // Estado do Filtro por Status do Projeto (US-022 - Padrão: apenas projetos ativos)
  const [filtroStatusProjeto, setFiltroStatusProjeto] = useState(() => {
    try {
      const saved = localStorage.getItem('cal_filtro_status_projeto');
      return saved !== null ? saved : 'ativo';
    } catch {
      return 'ativo';
    }
  });

  // Salvar preferência de status no localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('cal_filtro_status_projeto', filtroStatusProjeto);
    } catch (e) {
      console.error('Erro ao salvar filtro de status no calendário:', e);
    }
  }, [filtroStatusProjeto]);

  // Contadores de projetos por status (US-022)
  const statusCounts = useMemo(() => {
    const counts = { total: projetos.length, ativo: 0, pausado: 0, concluido: 0 };
    for (const p of projetos) {
      const s = p.status || 'ativo';
      if (counts[s] !== undefined) counts[s]++;
      else counts.ativo++;
    }
    return counts;
  }, [projetos]);

  // Agrupamento de projetos para os dropdowns de seleção (US-022)
  const { projetosAtivos, projetosPausados, projetosConcluidos } = useMemo(() => {
    return {
      projetosAtivos: projetos.filter(p => (p.status || 'ativo') === 'ativo'),
      projetosPausados: projetos.filter(p => p.status === 'pausado'),
      projetosConcluidos: projetos.filter(p => p.status === 'concluido')
    };
  }, [projetos]);

  // Projetos elegíveis conforme o filtro de status selecionado
  const projetosElegiveis = useMemo(() => {
    if (!filtroStatusProjeto || filtroStatusProjeto === 'todos') return projetos;
    return projetos.filter(p => (p.status || 'ativo') === filtroStatusProjeto);
  }, [projetos, filtroStatusProjeto]);

  // Drag and Drop no Calendário
  const [draggedAlocId, setDraggedAlocId] = useState(null);
  const [dragTargetDate, setDragTargetDate] = useState(null);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const nomeMesAno = useMemo(() => {
    return dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [dataAtual]);

  const navegarMes = (offset) => {
    setDataAtual(new Date(ano, mes + offset, 1));
  };

  const irHoje = () => {
    setDataAtual(new Date());
  };

  // Filtragem das alocações por Programador, Projeto e Status do Projeto (US-022)
  const alocacoesFiltradas = useMemo(() => {
    return alocacoes.filter(a => {
      const proj = projetos.find(p => p.id === a.projeto_id);
      const projStatus = proj?.status || 'ativo';
      if (filtroStatusProjeto && filtroStatusProjeto !== 'todos' && projStatus !== filtroStatusProjeto) {
        return false;
      }
      if (filtroProgramador && String(a.programador_id) !== String(filtroProgramador)) return false;
      if (filtroProjeto && String(a.projeto_id) !== String(filtroProjeto)) return false;
      return true;
    });
  }, [alocacoes, filtroProgramador, filtroProjeto, filtroStatusProjeto, projetos]);

  // Montagem da grade mensal (dias do mês anterior, atual e posterior)
  const gradeDias = useMemo(() => {
    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);

    const diaSemanaInicio = primeiroDiaMes.getDay(); // 0 = Domingo
    const totalDias = ultimoDiaMes.getDate();

    const dias = [];

    // Preenchimento dias mês anterior
    const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const d = ultimoDiaMesAnterior - i;
      const dataIso = new Date(ano, mes - 1, d).toISOString().split('T')[0];
      dias.push({ dia: d, iso: dataIso, isMesAtual: false, isFimDeSemana: false });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      const cur = new Date(ano, mes, d);
      const iso = cur.toISOString().split('T')[0];
      const isFimDeSemana = cur.getDay() === 0 || cur.getDay() === 6;
      dias.push({ dia: d, iso, isMesAtual: true, isFimDeSemana });
    }

    // Preenchimento dias mês seguinte
    const resto = 7 - (dias.length % 7);
    if (resto < 7) {
      for (let d = 1; d <= resto; d++) {
        const cur = new Date(ano, mes + 1, d);
        const iso = cur.toISOString().split('T')[0];
        dias.push({ dia: d, iso, isMesAtual: false, isFimDeSemana: false });
      }
    }

    return dias;
  }, [ano, mes]);

  const hojeIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="view-container calendario-page">
      {/* Cabeçalho Executivo Exclusivo para Impressão e PDF (US-022 / US-023) */}
      <PrintHeader 
        titulo="Calendário Mensal de Alocações de Recursos"
        subtitulo="Visão Calendário Mensal Consolidada"
        periodo={nomeMesAno}
      />

      <div className="view-header">
        <div>
          <h2>Calendário de Alocações ({nomeMesAno})</h2>
          <p>
            Consulte a dedicação dos programadores nos projetos por data (RN-06).
            <span className="drag-hint-badge">💡 Drag & Drop: arraste qualquer card de alocação para outro dia do mês</span>
          </p>
        </div>

        <div className="gantt-nav-controls">
          <button className="btn btn-secondary btn-sm" onClick={() => navegarMes(-1)}>
            ◀ Mês Anterior
          </button>
          <button className="btn btn-secondary btn-sm" onClick={irHoje}>
            Mês Atual
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navegarMes(1)}>
            Próximo Mês ▶
          </button>
          {/* Controles de Zoom In / Zoom Out */}
          <div className="zoom-controls-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--bg-input)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 4px', fontWeight: 600 }}>Zoom:</span>
            <button
              type="button"
              id="btn-cal-zoom-out"
              className={`btn btn-sm ${zoomCal === 'compacto' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomCal('compacto')}
              title="Zoom Out: Altura compacta (visão panorâmica do mês)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              🔍- Compacto
            </button>
            <button
              type="button"
              id="btn-cal-zoom-reset"
              className={`btn btn-sm ${zoomCal === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomCal('normal')}
              title="Zoom Padrão (100%)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              100%
            </button>
            <button
              type="button"
              id="btn-cal-zoom-in"
              className={`btn btn-sm ${zoomCal === 'expandido' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomCal('expandido')}
              title="Zoom In: Altura expandida (detalhes e observações)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              🔍+ Expandido
            </button>
          </div>

          <button 
            type="button"
            id="btn-imprimir-calendario"
            className="btn btn-secondary btn-sm btn-print-action"
            onClick={() => window.print()}
            title="Imprimir ou Salvar em PDF o Calendário Mensal (Layout Otimizado A4 Paisagem)"
          >
            <span>🖨️</span> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Barra de Filtros Rápida com Filtro de Status (US-022) */}
      <div className="gantt-filters-bar" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {isDesenvolvedor && (
          <span
            style={{
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(8, 145, 178, 0.15)',
              color: '#0891B2',
              border: '1px solid rgba(8, 145, 178, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Você está acessando como Desenvolvedor: modo exclusivo para consulta e acompanhamento."
          >
            <span>👨‍💻</span> Modo Consulta (Leitura)
          </span>
        )}

        {!contarFinaisDeSemana && (
          <span
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Parâmetro ativo: Finais de semana NÃO são computados como dias de alocação."
          >
            <span>🚫 🗓️</span> FDS Não Computado
          </span>
        )}

        {/* Filtro por Status do Projeto (US-022) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select 
            id="cal-filtro-status-projeto"
            value={filtroStatusProjeto} 
            onChange={e => setFiltroStatusProjeto(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem', minWidth: '170px' }}
            title="Filtrar alocações no calendário pelo status do projeto (US-022)"
          >
            <option value="ativo">🟢 Apenas Ativos ({statusCounts.ativo})</option>
            <option value="pausado">⏸️ Pausados ({statusCounts.pausado})</option>
            <option value="concluido">✓ Concluídos ({statusCounts.concluido})</option>
            <option value="todos">🌐 Todos os Status ({statusCounts.total})</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filtrar Projeto:</span>
          <select 
            value={filtroProjeto} 
            onChange={e => setFiltroProjeto(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem', minWidth: '180px' }}
          >
            <option value="">Todos ({projetosElegiveis.length})</option>
            {projetosAtivos.length > 0 && (
              <optgroup label="🟢 Projetos Ativos">
                {projetosAtivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </optgroup>
            )}
            {projetosPausados.length > 0 && (
              <optgroup label="⏸️ Projetos Pausados">
                {projetosPausados.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} (Pausado)</option>
                ))}
              </optgroup>
            )}
            {projetosConcluidos.length > 0 && (
              <optgroup label="✓ Projetos Concluídos">
                {projetosConcluidos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} (Concluído)</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filtrar Programador:</span>
          <select 
            value={filtroProgramador} 
            onChange={e => setFiltroProgramador(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem', minWidth: '180px' }}
          >
            <option value="">Todos os Programadores ({programadores.length})</option>
            {programadores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {(filtroProjeto || filtroProgramador || filtroStatusProjeto !== 'ativo') && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => { setFiltroProjeto(''); setFiltroProgramador(''); setFiltroStatusProjeto('ativo'); }}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            ✕ Limpar Filtros
          </button>
        )}

        {/* Indicador de Projetos Ocultados por Status */}
        {filtroStatusProjeto === 'ativo' && (statusCounts.pausado + statusCounts.concluido) > 0 && (
          <span 
            className="info-status-pill"
            onClick={() => setFiltroStatusProjeto('todos')}
            title="Existem projetos pausados ou concluídos ocultos. Clique para exibir todos no calendário."
            style={{
              cursor: 'pointer',
              fontSize: '0.78rem',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ℹ️ {statusCounts.pausado + statusCounts.concluido} projeto(s) pausado(s)/concluído(s) oculto(s) (Clique para ver)
          </span>
        )}
      </div>

      <div className="calendario-grid-container">
        <div className="calendario-weekdays-header">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        <div className={`calendario-days-grid cal-zoom-${zoomCal}`}>
          {gradeDias.map(item => {
            const alocsDoDia = alocacoesFiltradas.filter(a => a.data === item.iso);
            const isHoje = item.iso === hojeIso;
            const isDropTarget = dragTargetDate === item.iso;

            // Ausências no dia (US-021)
            const ausenciasDoDia = (ausencias || []).filter(a => {
              if (filtroProgramador && a.programador_id && String(a.programador_id) !== String(filtroProgramador)) {
                return false;
              }
              return item.iso >= a.data_inicio && item.iso <= a.data_fim;
            });

            return (
              <div 
                key={item.iso} 
                className={`cal-day-cell ${!item.isMesAtual ? 'cal-day-outro-mes' : ''} ${item.isFimDeSemana && !contarFinaisDeSemana ? 'cal-day-fds-desabilitado' : ''} ${isHoje ? 'cal-day-hoje' : ''} ${isDropTarget ? 'cal-day-drop-target' : ''} ${ausenciasDoDia.length > 0 ? 'cal-day-has-ausencia' : ''}`}
                onDragOver={(e) => {
                  if (isDesenvolvedor) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={(e) => {
                  if (isDesenvolvedor) return;
                  e.preventDefault();
                  setDragTargetDate(item.iso);
                }}
                onDragLeave={(e) => {
                  if (isDesenvolvedor) return;
                  if (e.currentTarget.contains(e.relatedTarget)) return;
                  if (dragTargetDate === item.iso) setDragTargetDate(null);
                }}
                onDrop={(e) => {
                  if (isDesenvolvedor) return;
                  e.preventDefault();
                  setDragTargetDate(null);
                  const raw = e.dataTransfer.getData('application/json');
                  if (!raw) return;
                  try {
                    const draggedAloc = JSON.parse(raw);
                    if (draggedAloc.data === item.iso) return;
                    onMoverAlocacao && onMoverAlocacao(draggedAloc, { data: item.iso });
                  } catch (err) {
                    console.error('Erro no drop do calendário:', err);
                  }
                }}
              >
                <div className="cal-day-header">
                  <span className={`cal-day-number ${isHoje ? 'hoje-badge' : ''}`}>{item.dia}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.isFimDeSemana && !contarFinaisDeSemana && (
                      <span className="cal-count-badge" style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>FDS</span>
                    )}
                    {alocsDoDia.length > 0 && (
                      <span className="cal-count-badge">{alocsDoDia.length} aloc.</span>
                    )}
                    {!isDesenvolvedor && (
                      <button
                        type="button"
                        className="cal-add-btn"
                        onClick={() => onCriarAlocacao && onCriarAlocacao({ data: item.iso })}
                        title={`Nova alocação em ${item.iso}`}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                <div className="cal-day-events">
                  {/* Ausências do Dia (Férias, Folgas, Feriados - US-021) */}
                  {ausenciasDoDia.map(aus => {
                    const dev = programadores.find(p => p.id === aus.programador_id);
                    const label = aus.programador_id ? (dev?.nome?.split(' ')[0] || 'Dev') : 'Feriado';
                    const icone = aus.tipo === 'ferias' ? '🏖️' : aus.tipo === 'folga' ? '🌴' : aus.tipo === 'licenca' ? '🩺' : '🎉';
                    return (
                      <div 
                        key={`aus-${aus.id}`}
                        className="cal-ausencia-pill"
                        onClick={() => !isDesenvolvedor && onAbrirAusencia && onAbrirAusencia(dev || null)}
                        title={`${icone} ${aus.tipo.toUpperCase()}: ${dev?.nome || 'Feriado Corporativo'}\n${aus.descricao || ''}${!isDesenvolvedor ? '\nClique para gerenciar ausências' : ''}`}
                      >
                        <span>{icone}</span>
                        <span className="cal-aus-label">{label} ({aus.tipo === 'ferias' ? 'Férias' : aus.tipo === 'folga' ? 'Folga' : aus.tipo === 'licenca' ? 'Licença' : 'Feriado'})</span>
                      </div>
                    );
                  })}

                  {alocsDoDia.map(aloc => {
                    const prog = programadores.find(p => p.id === aloc.programador_id);
                    const proj = projetos.find(pr => pr.id === aloc.projeto_id);
                    const cor = prog?.cor || '#2563EB';

                    return (
                      <div 
                        key={aloc.id}
                        className={`cal-event-pill ${draggedAlocId === aloc.id ? 'is-dragging' : ''} ${isDesenvolvedor ? 'is-readonly' : ''}`}
                        draggable={!isDesenvolvedor}
                        onDragStart={(e) => {
                          if (isDesenvolvedor) return;
                          e.stopPropagation();
                          e.dataTransfer.setData('application/json', JSON.stringify(aloc));
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedAlocId(aloc.id);
                        }}
                        onDragEnd={() => {
                          setDraggedAlocId(null);
                          setDragTargetDate(null);
                        }}
                        style={{ borderLeftColor: cor }}
                        onClick={() => onEditarAlocacao && onEditarAlocacao(aloc)}
                        title={isDesenvolvedor ? `Visualizar alocação: ${prog?.nome || 'Programador'} em ${proj?.nome || 'Projeto'} (${aloc.horas}h)` : `🖐️ Arraste para outro dia ou clique para editar\n${prog?.nome || 'Programador'} em ${proj?.nome || 'Projeto'} (${aloc.horas}h)${aloc.observacao ? `\nObs: ${aloc.observacao}` : ''}`}
                      >
                        {!isDesenvolvedor && <span className="drag-handle-dots" aria-hidden="true" style={{ fontSize: '0.65rem', opacity: 0.6 }}>⋮⋮</span>}
                        <span className="cal-event-dot" style={{ backgroundColor: cor }} />
                        <span className="cal-event-name">{prog?.nome?.split(' ')[0] || 'Dev'}</span>
                        <span className="cal-event-hours">{aloc.horas}h</span>
                        {zoomCal === 'expandido' && proj?.nome && (
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', marginTop: '2px' }}>
                            📁 {proj.nome}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
