import React, { useState, useMemo, useEffect } from 'react';
import PrintHeader from './PrintHeader';

// Calcula contraste para texto preto ou branco
function getContrastColor(hexColor) {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#111827' : '#FFFFFF';
}

export default function GanttView({ 
  projetos, 
  programadores, 
  alocacoes, 
  ausencias = [],
  usuarioLogado = null,
  contarFinaisDeSemana = false,
  onCriarAlocacao, 
  onEditarAlocacao,
  onMoverAlocacao,
  onSalvarLote,
  onAbrirAusencia
}) {
  const isDesenvolvedor = usuarioLogado?.perfil === 'desenvolvedor';

  // Nível de Zoom no Gantt: 'compacto' (46px), 'normal' (70px), 'expandido' (105px)
  const [zoomGantt, setZoomGantt] = useState(() => {
    try {
      return localStorage.getItem('gantt_zoom') || 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gantt_zoom', zoomGantt);
    } catch (e) {
      console.error('Erro ao salvar preferência de zoom do gantt:', e);
    }
  }, [zoomGantt]);

  const colWidth = zoomGantt === 'compacto' ? 46 : zoomGantt === 'expandido' ? 105 : 70;

  // Controle da data base inicial para o Gantt (padrão: início da semana atual - Segunda-feira)
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  const [diasExibidos, setDiasExibidos] = useState(14); // 2 semanas por padrão
  const [filtroProjeto, setFiltroProjeto] = useState('');
  const [filtroProgramador, setFiltroProgramador] = useState('');

  // Estado do Filtro por Status do Projeto (US-022 - Padrão: apenas projetos ativos)
  const [filtroStatusProjeto, setFiltroStatusProjeto] = useState(() => {
    try {
      const saved = localStorage.getItem('gantt_filtro_status_projeto');
      return saved !== null ? saved : 'ativo';
    } catch {
      return 'ativo';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gantt_filtro_status_projeto', filtroStatusProjeto);
    } catch (e) {
      console.error('Erro ao salvar preferência de filtro de status do projeto:', e);
    }
  }, [filtroStatusProjeto]);

  // Estado do Filtro de Finais de Semana (US-018)
  const [ocultarFimDeSemana, setOcultarFimDeSemana] = useState(() => {
    try {
      return localStorage.getItem('gantt_ocultar_fds') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gantt_ocultar_fds', String(ocultarFimDeSemana));
    } catch (e) {
      console.error('Erro ao salvar preferência de fim de semana:', e);
    }
  }, [ocultarFimDeSemana]);

  // Estado do Popover de Links Rápidos do Projeto (US-019)
  const [openLinksProjId, setOpenLinksProjId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenLinksProjId(null);
    };
    const handleClickOutside = () => setOpenLinksProjId(null);

    if (openLinksProjId !== null) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [openLinksProjId]);

  // Estados de Accordion e Ocultação de Linhas Vazias (US-017)
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());
  const [ocultarSemAlocacao, setOcultarSemAlocacao] = useState(() => {
    try {
      return localStorage.getItem('gantt_ocultar_sem_alocacao') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gantt_ocultar_sem_alocacao', String(ocultarSemAlocacao));
    } catch (e) {
      console.error('Erro ao salvar preferência de devs sem alocação:', e);
    }
  }, [ocultarSemAlocacao]);

  const toggleProjectCollapse = (projectId) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const collapseAllProjects = () => {
    setCollapsedProjects(new Set(projetos.map(p => p.id)));
  };

  const expandAllProjects = () => {
    setCollapsedProjects(new Set());
  };

  // Estados de Drag and Drop
  const [draggedAlocId, setDraggedAlocId] = useState(null);
  const [dragTargetKey, setDragTargetKey] = useState(null);

  // Gera array de datas consecutivas (com suporte a ocultar finais de semana — US-018)
  const listaDatas = useMemo(() => {
    const datas = [];
    const base = new Date(dataInicio + 'T00:00:00');
    for (let i = 0; i < diasExibidos; i++) {
      const cur = new Date(base);
      cur.setDate(base.getDate() + i);
      const iso = cur.toISOString().split('T')[0];
      const diaSemana = cur.toLocaleDateString('pt-BR', { weekday: 'short' });
      const diaMes = cur.getDate();
      const mes = cur.toLocaleDateString('pt-BR', { month: 'short' });
      const isFimDeSemana = cur.getDay() === 0 || cur.getDay() === 6;
      if (!ocultarFimDeSemana || !isFimDeSemana) {
        datas.push({ iso, diaSemana, diaMes, mes, isFimDeSemana });
      }
    }
    return datas;
  }, [dataInicio, diasExibidos, ocultarFimDeSemana]);

  // Estados de Extensão por Arraste Contínuo (Drag-to-Fill com Alça de Preenchimento)
  const [extending, setExtending] = useState({
    active: false,
    sourceAloc: null,
    projectId: null,
    programmerId: null,
    programmerCor: null,
    startDate: null,
    currentDate: null,
    targetDates: []
  });

  const handleStartExtend = (e, aloc, proj, prog, dateIso) => {
    e.stopPropagation();
    e.preventDefault();
    setExtending({
      active: true,
      sourceAloc: aloc,
      projectId: proj.id,
      programmerId: prog.id,
      programmerCor: prog.cor,
      startDate: dateIso,
      currentDate: dateIso,
      targetDates: []
    });
  };

  const handleCellMouseEnter = (projId, progId, dateIso) => {
    if (!extending.active) return;
    if (extending.projectId !== projId || extending.programmerId !== progId) return;

    const start = extending.startDate;
    const end = dateIso;
    const [minDate, maxDate] = start <= end ? [start, end] : [end, start];

    // Pega todas as datas entre minDate e maxDate na lista de datas exibidas
    // Se o parâmetro de sistema for não contar finais de semana, ignora sábado e domingo
    const dates = listaDatas
      .filter(d => (!contarFinaisDeSemana ? !d.isFimDeSemana : true))
      .map(d => d.iso)
      .filter(iso => iso >= minDate && iso <= maxDate && iso !== extending.startDate);

    setExtending(prev => ({
      ...prev,
      currentDate: dateIso,
      targetDates: dates
    }));
  };

  useEffect(() => {
    const handleGlobalMouseUp = async () => {
      if (!extending.active) return;
      const { sourceAloc, targetDates } = extending;

      // Reseta o estado
      setExtending({
        active: false,
        sourceAloc: null,
        projectId: null,
        programmerId: null,
        programmerCor: null,
        startDate: null,
        currentDate: null,
        targetDates: []
      });

      if (targetDates && targetDates.length > 0 && onSalvarLote && sourceAloc) {
        const alocacoesParaCriar = targetDates.map(dateIso => ({
          programador_id: sourceAloc.programador_id,
          projeto_id: sourceAloc.projeto_id,
          data: dateIso,
          horas: sourceAloc.horas,
          dia_todo: sourceAloc.dia_todo,
          observacao: sourceAloc.observacao || ''
        }));
        await onSalvarLote(alocacoesParaCriar);
      }
    };

    if (extending.active) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [extending, onSalvarLote]);

  // Contabiliza alocações em finais de semana que foram ocultadas pelo filtro (US-018 Cenário 2)
  const alocacoesOcultasNoFds = useMemo(() => {
    if (!ocultarFimDeSemana) return 0;
    const datasFds = new Set();
    const base = new Date(dataInicio + 'T00:00:00');
    for (let i = 0; i < diasExibidos; i++) {
      const cur = new Date(base);
      cur.setDate(base.getDate() + i);
      if (cur.getDay() === 0 || cur.getDay() === 6) {
        datasFds.add(cur.toISOString().split('T')[0]);
      }
    }
    return alocacoes.filter(a => datasFds.has(a.data)).length;
  }, [ocultarFimDeSemana, dataInicio, diasExibidos, alocacoes]);

  // Avançar / retroceder no tempo
  const navegarTempo = (dias) => {
    const base = new Date(dataInicio + 'T00:00:00');
    base.setDate(base.getDate() + dias);
    setDataInicio(base.toISOString().split('T')[0]);
  };

  const voltarHoje = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    setDataInicio(monday.toISOString().split('T')[0]);
  };

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

  // Filtragem de Projetos por Status e Seleção Específica (US-022)
  const projetosFiltrados = useMemo(() => {
    return projetos.filter(p => {
      const pStatus = p.status || 'ativo';
      if (filtroStatusProjeto && filtroStatusProjeto !== 'todos' && pStatus !== filtroStatusProjeto) {
        return false;
      }
      if (filtroProjeto && String(p.id) !== String(filtroProjeto)) {
        return false;
      }
      return true;
    });
  }, [projetos, filtroProjeto, filtroStatusProjeto]);

  const programadoresFiltrados = useMemo(() => {
    if (!filtroProgramador) return programadores;
    return programadores.filter(p => String(p.id) === String(filtroProgramador));
  }, [programadores, filtroProgramador]);

  return (
    <div className="view-container gantt-page">
      {/* Cabeçalho Executivo Exclusivo para Impressão e PDF (US-022 / US-023) */}
      <PrintHeader 
        titulo="Mapa de Alocação de Programadores — Linha do Tempo (Gantt)"
        subtitulo={`Visualização Matricial de Projetos e Recursos (${listaDatas.length} dias exibidos${ocultarFimDeSemana ? ' — apenas dias úteis' : ''})`}
        periodo={listaDatas.length > 0 ? `${listaDatas[0].diaMes}/${listaDatas[0].mes} até ${listaDatas[listaDatas.length - 1].diaMes}/${listaDatas[listaDatas.length - 1].mes}` : ''}
      />

      <div className="view-header">
        <div>
          <h2>Linha do Tempo (Gantt) — Visão Matricial</h2>
          <p>
            Projetos nas linhas mestras, programadores nas sublinhas e datas nas colunas (RN-05).
            <span className="drag-hint-badge">💡 Drag & Drop ativo: arraste blocos de alocação entre dias ou programadores</span>
          </p>
        </div>

        <div className="gantt-nav-controls">
          <button className="btn btn-secondary btn-sm" onClick={() => navegarTempo(-7)}>
            ◀ Semana Anterior
          </button>
          <button className="btn btn-secondary btn-sm" onClick={voltarHoje}>
            Hoje
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navegarTempo(7)}>
            Próxima Semana ▶
          </button>
          <select 
            className="period-select"
            value={diasExibidos} 
            onChange={e => setDiasExibidos(Number(e.target.value))}
            aria-label="Período exibido"
          >
            <option value={7}>1 Semana (7 dias)</option>
            <option value={14}>2 Semanas (14 dias)</option>
            <option value={21}>3 Semanas (21 dias)</option>
            <option value={30}>1 Mês (30 dias)</option>
          </select>
          {/* Controles de Zoom In / Zoom Out */}
          <div className="zoom-controls-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--bg-input)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 4px', fontWeight: 600 }}>Zoom:</span>
            <button
              type="button"
              id="btn-gantt-zoom-out"
              className={`btn btn-sm ${zoomGantt === 'compacto' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomGantt('compacto')}
              title="Zoom Out: Mais dias na tela (Largura compacta 46px)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              🔍- Compacto
            </button>
            <button
              type="button"
              id="btn-gantt-zoom-reset"
              className={`btn btn-sm ${zoomGantt === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomGantt('normal')}
              title="Zoom Padrão (100% — 70px)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              100%
            </button>
            <button
              type="button"
              id="btn-gantt-zoom-in"
              className={`btn btn-sm ${zoomGantt === 'expandido' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomGantt('expandido')}
              title="Zoom In: Detalhes ampliados (Largura expandida 105px)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              🔍+ Expandido
            </button>
          </div>

          <button 
            type="button"
            id="btn-imprimir-gantt"
            className="btn btn-secondary btn-sm btn-print-action"
            onClick={() => window.print()}
            title="Imprimir ou Salvar em PDF (Layout A4 Paisagem)"
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
            title="Parâmetro ativo: Finais de semana NÃO são computados como dias de alocação (apenas dias úteis Seg-Sex)."
          >
            <span>🚫 🗓️</span> FDS Não Computado
          </span>
        )}

        {/* Filtro por Status do Projeto (US-022) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select 
            id="filtro-status-projeto"
            value={filtroStatusProjeto} 
            onChange={e => setFiltroStatusProjeto(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem', minWidth: '170px' }}
            title="Filtrar projetos exibidos no Gantt pelo status (US-022)"
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
            <option value="">Todos ({projetosFiltrados.length})</option>
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
            title="Existem projetos pausados ou concluídos ocultos. Clique para exibir todos no Gantt."
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

        {/* Controles de Accordion Globais (US-017) */}
        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={collapseAllProjects}
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
            title="Recolher todos os projetos"
          >
            ▸ Recolher Todos
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={expandAllProjects}
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
            title="Expandir todos os projetos"
          >
            ▾ Expandir Todos
          </button>
        </div>

        {/* Alternador Ocultar Devs Sem Alocação (US-017) */}
        <button
          type="button"
          id="btn-toggle-sem-alocacao"
          className={`btn btn-sm ${ocultarSemAlocacao ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setOcultarSemAlocacao(!ocultarSemAlocacao)}
          style={{ padding: '5px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title={ocultarSemAlocacao ? 'Mostrar todos os programadores cadastrados em cada projeto' : 'Ocultar desenvolvedores que não possuem alocação neste projeto no período'}
        >
          <span>{ocultarSemAlocacao ? '👥' : '👤'}</span>
          <span>{ocultarSemAlocacao ? 'Mostrar Todos os Devs' : 'Ocultar Devs Sem Alocação'}</span>
        </button>

        {/* Botão de Alternância de Finais de Semana (US-018) */}
        <button
          type="button"
          id="btn-toggle-fds"
          className={`btn btn-sm ${ocultarFimDeSemana ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setOcultarFimDeSemana(!ocultarFimDeSemana)}
          style={{ padding: '5px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title={ocultarFimDeSemana ? 'Exibir sábados e domingos no Gantt' : 'Ocultar sábados e domingos para focar em dias úteis (Segunda a Sexta)'}
        >
          <span>{ocultarFimDeSemana ? '📅' : '🗓️'}</span>
          <span>{ocultarFimDeSemana ? 'Mostrar Finais de Semana' : 'Ocultar Finais de Semana'}</span>
        </button>

        {/* Indicador de Alocações em FDS Ocultadas */}
        {alocacoesOcultasNoFds > 0 && (
          <span 
            className="warning-weekend-pill"
            onClick={() => setOcultarFimDeSemana(false)}
            title={`Existem ${alocacoesOcultasNoFds} alocação(ões) em finais de semana neste período. Clique para exibi-las.`}
            style={{ 
              cursor: 'pointer', 
              fontSize: '0.78rem', 
              background: 'var(--warning-bg)', 
              color: 'var(--warning)', 
              border: '1px solid var(--warning)', 
              padding: '4px 10px', 
              borderRadius: 'var(--radius-xs)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 600
            }}
          >
            ⚠️ {alocacoesOcultasNoFds} alocação(ões) em fim de semana oculta(s) (Clique para ver)
          </span>
        )}
      </div>

      {/* Indicador Flutuante de Extensão Contínua (Drag-to-Fill) */}
      {extending.active && extending.targetDates.length > 0 && (
        <div className="extending-floating-banner">
          <span style={{ fontSize: '1.1rem' }}>✨</span>
          <span>
            Estendendo alocação: preenchendo <strong>{extending.targetDates.length} dia(s)</strong> com <strong>{extending.sourceAloc?.horas || 8}h</strong>. Solte o mouse para aplicar.
          </span>
        </div>
      )}

      {/* Painel do Gantt */}
      <div className="gantt-wrapper">
        <div className="gantt-table-container">
          <table className="gantt-grid">
            <thead>
              <tr>
                <th className="gantt-col-project sticky-col">
                  <span>Projetos & Programadores</span>
                </th>
                {listaDatas.map(d => (
                  <th 
                    key={d.iso} 
                    className={`gantt-col-date ${d.isFimDeSemana ? 'col-weekend' : ''} ${d.isFimDeSemana && !contarFinaisDeSemana ? 'col-fds-desabilitado' : ''}`}
                    style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                    title={`${d.iso}${d.isFimDeSemana && !contarFinaisDeSemana ? ' — Fim de semana (Não computado nas alocações)' : ''}`}
                  >
                    <div className="date-header-inner">
                      <span className="date-weekday">{d.diaSemana}</span>
                      <span className="date-number">{d.diaMes}</span>
                      <span className="date-month">{d.mes}</span>
                      {d.isFimDeSemana && !contarFinaisDeSemana && (
                        <span style={{ fontSize: '0.62rem', opacity: 0.7, display: 'block', marginTop: '2px' }}>FDS</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projetosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={listaDatas.length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Nenhum projeto encontrado para o filtro atual.</p>
                  </td>
                </tr>
              ) : (
                projetosFiltrados.map(proj => {
                  const isCollapsed = collapsedProjects.has(proj.id);

                  // Programadores com alocação ativa neste projeto nas datas exibidas
                  const devsComAlocacao = new Set(
                    alocacoes
                      .filter(a => a.projeto_id === proj.id && listaDatas.some(d => d.iso === a.data))
                      .map(a => a.programador_id)
                  );
                  const totalDevsAlocados = devsComAlocacao.size;

                  // Programadores elegíveis para exibição
                  const programadoresExibidos = programadoresFiltrados.filter(prog => {
                    if (!ocultarSemAlocacao) return true;
                    return devsComAlocacao.has(prog.id);
                  });

                  return (
                    <React.Fragment key={proj.id}>
                      {/* Linha Principal do Projeto (Accordion) */}
                      <tr 
                        className={`row-project-main ${isCollapsed ? 'is-collapsed' : ''}`}
                        onClick={() => toggleProjectCollapse(proj.id)}
                        style={{ cursor: 'pointer' }}
                        title={isCollapsed ? `Clique para expandir programadores de ${proj.nome}` : `Clique para recolher programadores de ${proj.nome}`}
                      >
                        <td className="sticky-col project-title-cell">
                          <div className="project-cell-content">
                            <span className="project-collapse-icon" aria-hidden="true">
                              {isCollapsed ? '▸' : '▾'}
                            </span>
                            <span className="folder-icon">📁</span>
                            <strong>{proj.nome}</strong>
                            <span className={`project-status-pill status-${proj.status || 'ativo'}`}>
                              {proj.status === 'pausado' ? '⏸️ Pausado' : proj.status === 'concluido' ? '✓ Concluído' : '🟢 Ativo'}
                            </span>
                            <span className="project-devs-count-badge" title={`${totalDevsAlocados} desenvolvedor(es) com alocação ativa neste projeto no período`}>
                              {totalDevsAlocados} dev{totalDevsAlocados !== 1 ? 's' : ''}
                            </span>
                            {proj.links && proj.links.length > 0 && (
                              <div className="project-links-wrapper" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className={`links-count-pill links-count-btn ${openLinksProjId === proj.id ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenLinksProjId(openLinksProjId === proj.id ? null : proj.id);
                                  }}
                                  title="Ver links associados a este projeto (SharePoint, Git, Jira)"
                                  aria-expanded={openLinksProjId === proj.id}
                                >
                                  🔗 {proj.links.length}
                                </button>

                                {openLinksProjId === proj.id && (
                                  <div 
                                    className="links-popover-menu" 
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="popover-header">
                                      <span className="popover-title">
                                        Links de {proj.nome}
                                      </span>
                                      <button
                                        type="button"
                                        className="popover-close-btn"
                                        onClick={() => setOpenLinksProjId(null)}
                                        title="Fechar"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="popover-links-list">
                                      {proj.links.map(link => (
                                        <a
                                          key={link.id || link.url}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="popover-link-item"
                                          title={link.url}
                                          onClick={() => setOpenLinksProjId(null)}
                                        >
                                          <span className="popover-link-icon">🌐</span>
                                          <span className="popover-link-label">{link.rotulo || 'Link do Projeto'}</span>
                                          <span className="popover-link-arrow">↗</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        {listaDatas.map(d => {
                          const totalHorasProjetoDia = alocacoes
                            .filter(a => a.projeto_id === proj.id && a.data === d.iso)
                            .reduce((acc, curr) => acc + (Number(curr.horas) || 8), 0);

                          return (
                            <td 
                              key={d.iso} 
                              className={`cell-project-summary ${d.isFimDeSemana ? 'cell-weekend' : ''} ${totalHorasProjetoDia > 0 ? 'has-hours' : ''}`}
                            >
                              {totalHorasProjetoDia > 0 && (
                                <span className="project-day-summary-pill" title={`${totalHorasProjetoDia}h alocadas em ${proj.nome} no dia ${d.iso}`}>
                                  {totalHorasProjetoDia}h
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Sublinhas dos Programadores (exibidas apenas se o projeto não estiver recolhido) */}
                      {!isCollapsed && (
                        programadoresExibidos.length === 0 ? (
                          <tr className="row-no-devs">
                            <td 
                              colSpan={listaDatas.length + 1} 
                              style={{ 
                                textAlign: 'center', 
                                padding: '12px 16px', 
                                fontSize: '0.82rem', 
                                color: 'var(--text-muted)', 
                                background: 'var(--bg-card)',
                                fontStyle: 'italic'
                              }}
                            >
                              Nenhum desenvolvedor alocado neste projeto no período exibido.
                            </td>
                          </tr>
                        ) : (
                          programadoresExibidos.map(prog => {
                            return (
                              <tr key={`${proj.id}-${prog.id}`} className="row-programmer-sub">
                                <td className="sticky-col prog-title-cell">
                                  <div className="prog-cell-content">
                                    <span 
                                      className="prog-dot" 
                                      style={{ backgroundColor: prog.cor }}
                                      title={`Cor: ${prog.cor}`}
                                    />
                                    <span className="prog-name">{prog.nome}</span>
                                  </div>
                                </td>

                                {listaDatas.map(d => {
                                  const cellKey = `${proj.id}-${prog.id}-${d.iso}`;
                                  const isDropTarget = dragTargetKey === cellKey;

                                  // Busca alocação correspondente
                                  const aloc = alocacoes.find(
                                    a => a.projeto_id === proj.id && a.programador_id === prog.id && a.data === d.iso
                                  );

                                  // Busca total de horas do programador em todos os projetos nesta data para detecção de sobrecarga
                                  const totalHorasDia = alocacoes
                                    .filter(a => a.programador_id === prog.id && a.data === d.iso)
                                    .reduce((acc, curr) => acc + (Number(curr.horas) || 8), 0);

                                  const temSobrecarga = totalHorasDia > 8;

                                  const isExtendingTarget = extending.active &&
                                    extending.projectId === proj.id &&
                                    extending.programmerId === prog.id &&
                                    extending.targetDates.includes(d.iso);

                                  // Verifica se o programador está em ausência nesta data (US-021)
                                  const ausenciaDoDia = (ausencias || []).find(a => {
                                    const matchDev = !a.programador_id || String(a.programador_id) === String(prog.id);
                                    return matchDev && d.iso >= a.data_inicio && d.iso <= a.data_fim;
                                  });

                                  return (
                                    <td 
                                      key={d.iso} 
                                      className={`cell-day-slot ${d.isFimDeSemana ? 'cell-weekend' : ''} ${d.isFimDeSemana && !contarFinaisDeSemana ? 'cell-fds-desabilitado' : ''} ${ausenciaDoDia ? 'cell-ausencia' : ''} ${isDropTarget ? 'cell-drop-target' : ''} ${isExtendingTarget ? 'cell-extending-target' : ''}`}
                                      style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                                      data-project-id={proj.id}
                                      data-prog-id={prog.id}
                                      data-date={d.iso}
                                      onMouseEnter={() => handleCellMouseEnter(proj.id, prog.id, d.iso)}
                                      onDragOver={(e) => {
                                        if (isDesenvolvedor) return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                      }}
                                      onDragEnter={(e) => {
                                        if (isDesenvolvedor) return;
                                        e.preventDefault();
                                        setDragTargetKey(cellKey);
                                      }}
                                      onDragLeave={(e) => {
                                        if (isDesenvolvedor) return;
                                        if (e.currentTarget.contains(e.relatedTarget)) return;
                                        if (dragTargetKey === cellKey) setDragTargetKey(null);
                                      }}
                                      onDrop={(e) => {
                                        if (isDesenvolvedor) return;
                                        e.preventDefault();
                                        setDragTargetKey(null);
                                        const raw = e.dataTransfer.getData('application/json');
                                        if (!raw) return;
                                        try {
                                          const draggedAloc = JSON.parse(raw);
                                          // Evita disparar se soltou na mesma célula
                                          if (
                                            draggedAloc.projeto_id === proj.id && 
                                            draggedAloc.programador_id === prog.id && 
                                            draggedAloc.data === d.iso
                                          ) {
                                            return;
                                          }
                                          onMoverAlocacao && onMoverAlocacao(draggedAloc, {
                                            projeto_id: proj.id,
                                            programador_id: prog.id,
                                            data: d.iso
                                          });
                                        } catch (err) {
                                          console.error('Erro ao processar drop:', err);
                                        }
                                      }}
                                    >
                                      {isExtendingTarget ? (
                                        <div 
                                          className="extending-preview-block"
                                          style={{ 
                                            backgroundColor: extending.programmerCor,
                                            color: getContrastColor(extending.programmerCor)
                                          }}
                                          title={`Replicar ${extending.sourceAloc?.horas || 8}h nesta data`}
                                        >
                                          <span className="extending-preview-text">+{extending.sourceAloc?.horas || 8}h</span>
                                        </div>
                                      ) : aloc ? (
                                        <div 
                                          className={`alocacao-block ${draggedAlocId === aloc.id ? 'is-dragging' : ''} ${isDesenvolvedor ? 'is-readonly' : ''}`}
                                          draggable={!isDesenvolvedor && !extending.active}
                                          onDragStart={(e) => {
                                            if (isDesenvolvedor || extending.active) {
                                              e.preventDefault();
                                              return;
                                            }
                                            e.dataTransfer.setData('application/json', JSON.stringify(aloc));
                                            e.dataTransfer.effectAllowed = 'move';
                                            setDraggedAlocId(aloc.id);
                                          }}
                                          onDragEnd={() => {
                                            setDraggedAlocId(null);
                                            setDragTargetKey(null);
                                          }}
                                          style={{ 
                                            backgroundColor: prog.cor,
                                            color: getContrastColor(prog.cor),
                                            boxShadow: temSobrecarga ? '0 0 0 2px #EF4444' : undefined 
                                          }}
                                          onClick={() => onEditarAlocacao && onEditarAlocacao(aloc)}
                                          title={isDesenvolvedor ? `Visualizar alocação: ${prog.nome} em ${proj.nome}: ${aloc.horas}h` : `🖐️ Arraste pelo centro para mover ou puxe a alça no canto para estender por mais dias\n${prog.nome} em ${proj.nome}: ${aloc.horas}h ${aloc.dia_todo ? '(Dia todo)' : '(Parcial)'} ${aloc.observacao ? `\nObs: ${aloc.observacao}` : ''} ${temSobrecarga ? `\n⚠️ Sobrecarga total no dia: ${totalHorasDia}h` : ''}`}
                                        >
                                          {!isDesenvolvedor && <span className="drag-handle-dots" aria-hidden="true">⋮⋮</span>}
                                          <span className="aloc-badge-hours">{aloc.horas}h</span>
                                          {temSobrecarga && (
                                            <span className="warning-overload" title={`Sobrecarga: ${totalHorasDia}h no dia`}>⚠️</span>
                                          )}
                                          {ausenciaDoDia && (
                                            <span className="warning-overload" title={`Atenção: Alocado em dia de ${ausenciaDoDia.tipo} (${ausenciaDoDia.descricao || ''})`}>🏖️</span>
                                          )}
                                          {/* Alça de Preenchimento (Fill Handle) — Apenas para Gestores / PM */}
                                          {!isDesenvolvedor && (
                                            <div 
                                              className="fill-handle"
                                              title="Clique e arraste horizontalmente para estender esta alocação para outros dias"
                                              onMouseDown={(e) => handleStartExtend(e, aloc, proj, prog, d.iso)}
                                            />
                                          )}
                                        </div>
                                      ) : ausenciaDoDia ? (
                                        <div 
                                          className="ausencia-slot-badge"
                                          onClick={() => !isDesenvolvedor && onAbrirAusencia && onAbrirAusencia(prog)}
                                          title={`${ausenciaDoDia.tipo === 'ferias' ? '🏖️ Férias' : ausenciaDoDia.tipo === 'folga' ? '🌴 Folga' : ausenciaDoDia.tipo === 'licenca' ? '🩺 Licença' : '🎉 Feriado'}: ${prog.nome} ausente em ${d.iso} (${ausenciaDoDia.descricao || 'Período programado'})${!isDesenvolvedor ? '\nClique para gerenciar ausências' : ''}`}
                                        >
                                          <span className="ausencia-icon">
                                            {ausenciaDoDia.tipo === 'ferias' ? '🏖️' : ausenciaDoDia.tipo === 'folga' ? '🌴' : ausenciaDoDia.tipo === 'licenca' ? '🩺' : '🎉'}
                                          </span>
                                          <span className="ausencia-label">
                                            {ausenciaDoDia.tipo === 'ferias' ? 'Férias' : ausenciaDoDia.tipo === 'folga' ? 'Folga' : ausenciaDoDia.tipo === 'licenca' ? 'Licença' : 'Feriado'}
                                          </span>
                                        </div>
                                      ) : isDesenvolvedor ? (
                                        <div className="empty-slot empty-slot-readonly" title="Espaço livre (Modo Leitura)" />
                                      ) : (
                                        <div 
                                          className="empty-slot" 
                                          onClick={() => onCriarAlocacao && onCriarAlocacao({
                                            projeto_id: proj.id,
                                            programador_id: prog.id,
                                            data: d.iso
                                          })}
                                          title={`Clique para alocar ${prog.nome} em ${proj.nome} em ${d.iso} ou arraste uma alocação para cá`}
                                        >
                                          <span className="slot-plus">+</span>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
