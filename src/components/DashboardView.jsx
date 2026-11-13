import React, { useState, useMemo } from 'react';
import PrintHeader from './PrintHeader';

export default function DashboardView({
  alocacoes,
  programadores,
  projetos,
  ausencias = [],
  contarFinaisDeSemana = false
}) {
  // Controle de densidade/zoom do Dashboard: 'compacto', 'normal', 'expandido'
  const [zoomDashboard, setZoomDashboard] = useState(() => {
    try {
      return localStorage.getItem('dashboard_zoom') || 'normal';
    } catch {
      return 'normal';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('dashboard_zoom', zoomDashboard);
    } catch (e) {
      console.error('Erro ao salvar preferência de zoom do dashboard:', e);
    }
  }, [zoomDashboard]);
  // Controle de período (Padrão: Mês Atual)
  const [tipoPeriodo, setTipoPeriodo] = useState('mes_atual');
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');

  // Cálculo das datas limites baseadas no tipo de período selecionado
  const { dataInicio, dataFim, labelPeriodo } = useMemo(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    if (tipoPeriodo === 'mes_atual') {
      const pDia = new Date(ano, mes, 1).toISOString().split('T')[0];
      const uDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
      const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return { dataInicio: pDia, dataFim: uDia, labelPeriodo: `Mês Atual (${nomeMes})` };
    }

    if (tipoPeriodo === 'proximo_mes') {
      const pDia = new Date(ano, mes + 1, 1).toISOString().split('T')[0];
      const uDia = new Date(ano, mes + 2, 0).toISOString().split('T')[0];
      const proxMesDate = new Date(ano, mes + 1, 1);
      const nomeMes = proxMesDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return { dataInicio: pDia, dataFim: uDia, labelPeriodo: `Próximo Mês (${nomeMes})` };
    }

    if (tipoPeriodo === 'proximos_30') {
      const dInicio = hoje.toISOString().split('T')[0];
      const dFimDate = new Date(hoje);
      dFimDate.setDate(hoje.getDate() + 30);
      return { 
        dataInicio: dInicio, 
        dataFim: dFimDate.toISOString().split('T')[0], 
        labelPeriodo: 'Próximos 30 Dias' 
      };
    }

    if (tipoPeriodo === 'ultimos_30') {
      const dInicioDate = new Date(hoje);
      dInicioDate.setDate(hoje.getDate() - 30);
      return { 
        dataInicio: dInicioDate.toISOString().split('T')[0], 
        dataFim: hoje.toISOString().split('T')[0], 
        labelPeriodo: 'Últimos 30 Dias' 
      };
    }

    if (tipoPeriodo === 'todos') {
      return { dataInicio: '1970-01-01', dataFim: '2099-12-31', labelPeriodo: 'Todo o Histórico' };
    }

    // Custom
    return {
      dataInicio: dataInicioCustom || '1970-01-01',
      dataFim: dataFimCustom || '2099-12-31',
      labelPeriodo: 'Período Personalizado'
    };
  }, [tipoPeriodo, dataInicioCustom, dataFimCustom]);

  // Alocações filtradas pelo período (respeitando o parâmetro de computar ou ignorar finais de semana)
  const alocacoesPeriodo = useMemo(() => {
    return alocacoes.filter(a => {
      if (a.data < dataInicio || a.data > dataFim) return false;
      if (!contarFinaisDeSemana) {
        const d = new Date(a.data + 'T00:00:00');
        if (d.getDay() === 0 || d.getDay() === 6) return false;
      }
      return true;
    });
  }, [alocacoes, dataInicio, dataFim, contarFinaisDeSemana]);

  // Contagem de alocações em finais de semana desconsideradas do cálculo
  const alocacoesFdsDesconsideradas = useMemo(() => {
    if (contarFinaisDeSemana) return 0;
    return alocacoes.filter(a => {
      if (a.data < dataInicio || a.data > dataFim) return false;
      const d = new Date(a.data + 'T00:00:00');
      return d.getDay() === 0 || d.getDay() === 6;
    }).length;
  }, [alocacoes, dataInicio, dataFim, contarFinaisDeSemana]);

  // Dias úteis no período
  const diasUteisNoPeriodo = useMemo(() => {
    if (dataInicio === '1970-01-01') return 22; // aproximação se histórico completo
    let count = 0;
    const cur = new Date(dataInicio + 'T00:00:00');
    const end = new Date(dataFim + 'T00:00:00');
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(count, 1);
  }, [dataInicio, dataFim]);

  // Horas totais alocadas
  const totalHoras = useMemo(() => {
    return alocacoesPeriodo.reduce((acc, curr) => acc + (Number(curr.horas) || 8), 0);
  }, [alocacoesPeriodo]);

  // Cálculo de horas de ausência (férias, folgas, feriados) em dias úteis no período (US-021 Cenário 4)
  const horasAusenciasNoPeriodo = useMemo(() => {
    if (!ausencias || ausencias.length === 0 || dataInicio === '1970-01-01') return 0;
    let totalAusenciaHoras = 0;
    const cur = new Date(dataInicio + 'T00:00:00');
    const end = new Date(dataFim + 'T00:00:00');
    const devsIds = new Set(programadores.map(p => String(p.id)));

    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        const iso = cur.toISOString().split('T')[0];
        const ausenciasDoDia = ausencias.filter(a => iso >= a.data_inicio && iso <= a.data_fim);
        for (const aus of ausenciasDoDia) {
          if (!aus.programador_id || aus.tipo === 'feriado') {
            totalAusenciaHoras += (programadores.length || 1) * 8;
          } else if (devsIds.has(String(aus.programador_id))) {
            totalAusenciaHoras += 8;
          }
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
    return totalAusenciaHoras;
  }, [ausencias, dataInicio, dataFim, programadores]);

  // Capacidade teórica bruta (Devs ativos * Dias Úteis * 8h)
  const capacidadeTeoricaEquipe = (programadores.length || 1) * diasUteisNoPeriodo * 8;

  // Capacidade Real Disponível descontando férias/ausências (US-021 Cenário 4)
  const capacidadeRealDisponivel = Math.max(capacidadeTeoricaEquipe - horasAusenciasNoPeriodo, 1);
  const taxaOcupacaoGeral = Math.min(Math.round((totalHoras / capacidadeRealDisponivel) * 100), 100);

  // Sobrecargas identificadas no período (> 8h no mesmo dia para um programador)
  const sobrecargas = useMemo(() => {
    const mapaDevDia = {};
    for (const a of alocacoesPeriodo) {
      const chave = `${a.programador_id}_${a.data}`;
      if (!mapaDevDia[chave]) {
        mapaDevDia[chave] = {
          programadorId: a.programador_id,
          data: a.data,
          horasTotais: 0,
          alocacoes: []
        };
      }
      mapaDevDia[chave].horasTotais += Number(a.horas) || 8;
      mapaDevDia[chave].alocacoes.push(a);
    }

    return Object.values(mapaDevDia).filter(item => item.horasTotais > 8);
  }, [alocacoesPeriodo]);

  // Agrupamento de horas por Projeto
  const metricasProjetos = useMemo(() => {
    const mapa = {};
    for (const proj of projetos) {
      mapa[proj.id] = {
        id: proj.id,
        nome: proj.nome,
        status: proj.status,
        horas: 0,
        devsIds: new Set(),
        alocacoesCount: 0
      };
    }

    for (const a of alocacoesPeriodo) {
      if (!mapa[a.projeto_id]) {
        mapa[a.projeto_id] = {
          id: a.projeto_id,
          nome: a.projeto_nome || 'Projeto Removido',
          status: 'desconhecido',
          horas: 0,
          devsIds: new Set(),
          alocacoesCount: 0
        };
      }
      mapa[a.projeto_id].horas += Number(a.horas) || 8;
      mapa[a.projeto_id].devsIds.add(a.programador_id);
      mapa[a.projeto_id].alocacoesCount += 1;
    }

    return Object.values(mapa)
      .map(p => ({
        ...p,
        devsCount: p.devsIds.size,
        percentual: totalHoras > 0 ? Math.round((p.horas / totalHoras) * 100) : 0
      }))
      .sort((a, b) => b.horas - a.horas);
  }, [projetos, alocacoesPeriodo, totalHoras]);

  // Agrupamento de horas por Programador
  const metricasProgramadores = useMemo(() => {
    const mapa = {};
    for (const prog of programadores) {
      mapa[prog.id] = {
        id: prog.id,
        nome: prog.nome,
        cor: prog.cor,
        email: prog.email,
        tecnologias: prog.tecnologias,
        horas: 0,
        diasAlocados: new Set(),
        projetosIds: new Set(),
        temSobrecarga: false
      };
    }

    for (const a of alocacoesPeriodo) {
      if (!mapa[a.programador_id]) {
        mapa[a.programador_id] = {
          id: a.programador_id,
          nome: a.programador_nome || 'Dev Removido',
          cor: a.programador_cor || '#2563EB',
          email: '',
          tecnologias: '',
          horas: 0,
          diasAlocados: new Set(),
          projetosIds: new Set(),
          temSobrecarga: false
        };
      }
      mapa[a.programador_id].horas += Number(a.horas) || 8;
      mapa[a.programador_id].diasAlocados.add(a.data);
      mapa[a.programador_id].projetosIds.add(a.projeto_id);
    }

    // Marca sobrecargas
    for (const s of sobrecargas) {
      if (mapa[s.programadorId]) {
        mapa[s.programadorId].temSobrecarga = true;
      }
    }

    // Calcula dias úteis de ausência individuais por programador (US-021)
    const ausenciaDiasPorDev = {};
    if (ausencias && ausencias.length > 0 && dataInicio !== '1970-01-01') {
      const cur = new Date(dataInicio + 'T00:00:00');
      const end = new Date(dataFim + 'T00:00:00');
      while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          const iso = cur.toISOString().split('T')[0];
          for (const aus of ausencias) {
            if (iso >= aus.data_inicio && iso <= aus.data_fim) {
              if (!aus.programador_id || aus.tipo === 'feriado') {
                for (const p of programadores) {
                  ausenciaDiasPorDev[p.id] = (ausenciaDiasPorDev[p.id] || 0) + 1;
                }
              } else {
                ausenciaDiasPorDev[aus.programador_id] = (ausenciaDiasPorDev[aus.programador_id] || 0) + 1;
              }
            }
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    return Object.values(mapa)
      .map(p => {
        const diasAusenciaDev = ausenciaDiasPorDev[p.id] || 0;
        const capacidadeIndividual = Math.max((diasUteisNoPeriodo - diasAusenciaDev) * 8, 0);
        const taxaOcupacao = capacidadeIndividual > 0 
          ? Math.min(Math.round((p.horas / capacidadeIndividual) * 100), 100)
          : (p.horas > 0 ? 100 : 0);

        const diasCount = p.diasAlocados.size;
        const mediaHorasDia = diasCount > 0 ? (p.horas / diasCount).toFixed(1) : 0;

        let statusCarga = 'Equilibrado';
        let statusClass = 'badge-success';

        if (p.temSobrecarga) {
          statusCarga = 'Sobrecarga';
          statusClass = 'badge-danger';
        } else if (diasAusenciaDev >= diasUteisNoPeriodo) {
          statusCarga = 'Em Férias/Ausente';
          statusClass = 'badge-info';
        } else if (p.horas === 0) {
          statusCarga = 'Sem Alocação';
          statusClass = 'badge-warning';
        } else if (taxaOcupacao < 60) {
          statusCarga = 'Disponível';
          statusClass = 'badge-info';
        }

        return {
          ...p,
          diasCount,
          diasAusencia: diasAusenciaDev,
          capacidadeIndividual,
          mediaHorasDia,
          taxaOcupacao,
          statusCarga,
          statusClass,
          projetosCount: p.projetosIds.size
        };
      })
      .sort((a, b) => b.horas - a.horas);
  }, [programadores, alocacoesPeriodo, sobrecargas, diasUteisNoPeriodo, ausencias, dataInicio, dataFim]);

  // ==========================================
  // EXPORTAÇÃO DE PLANILHA CSV (Fase 3)
  // ==========================================
  const handleExportCSV = () => {
    if (alocacoesPeriodo.length === 0) {
      alert('Não há alocações no período selecionado para exportar.');
      return;
    }

    // Cabeçalho CSV
    const headers = [
      'Data',
      'Dia da Semana',
      'Programador',
      'E-mail',
      'Projeto',
      'Status do Projeto',
      'Horas Alocadas',
      'Tipo (Integral/Parcial)',
      'Observação'
    ];

    const rows = alocacoesPeriodo.map(a => {
      const prog = programadores.find(p => p.id === a.programador_id);
      const proj = projetos.find(pr => pr.id === a.projeto_id);

      const d = new Date(a.data + 'T00:00:00');
      const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });

      return [
        a.data,
        diaSemana,
        prog?.nome || a.programador_nome || 'N/A',
        prog?.email || '',
        proj?.nome || a.projeto_nome || 'N/A',
        proj?.status || 'ativo',
        a.horas,
        a.dia_todo ? 'Integral (8h)' : 'Parcial',
        `"${(a.observacao || '').replace(/"/g, '""')}"`
      ].join(';');
    });

    // UTF-8 BOM (\uFEFF) para compatibilidade perfeita com Excel no Windows
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_alocacao_${dataInicio}_a_${dataFim}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-container dashboard-page">
      {/* Cabeçalho Executivo Exclusivo para Impressão e PDF (US-022 / US-023) */}
      <PrintHeader 
        titulo="Dashboard Executivo & Métricas de Capacidade"
        subtitulo="Visão Analítica de Capacidade, Ocupação da Equipe e Distribuição de Horas"
        periodo={labelPeriodo}
      />

      {/* Cabeçalho & Ações */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Dashboard Executivo & Métricas</h2>
          <p>Visão analítica de capacidade, ocupação da equipe e distribuição de horas ({labelPeriodo}).</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Controles de Zoom / Densidade do Dashboard */}
          <div className="zoom-controls-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--bg-input)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 4px', fontWeight: 600 }}>Zoom Gráficos:</span>
            <button
              type="button"
              id="btn-dash-zoom-out"
              className={`btn btn-sm ${zoomDashboard === 'compacto' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomDashboard('compacto')}
              title="Zoom Out: Gráficos mais densos e tela cheia"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              🔍- Compacto
            </button>
            <button
              type="button"
              id="btn-dash-zoom-reset"
              className={`btn btn-sm ${zoomDashboard === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomDashboard('normal')}
              title="Zoom Padrão (100%)"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              100%
            </button>
            <button
              type="button"
              id="btn-dash-zoom-in"
              className={`btn btn-sm ${zoomDashboard === 'expandido' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoomDashboard('expandido')}
              title="Zoom In: Gráficos ampliados com maior espaçamento"
              style={{ padding: '3px 8px', fontSize: '0.76rem' }}
            >
              🔍+ Expandido
            </button>
          </div>

          <button 
            id="btn-imprimir-dashboard"
            className="btn btn-secondary btn-sm btn-print-action"
            onClick={() => window.print()}
            title="Imprimir ou Salvar em PDF o Dashboard Executivo (Layout Otimizado A4 Paisagem)"
          >
            <span>🖨️</span> Imprimir / PDF
          </button>
          <button 
            id="btn-export-csv"
            className="btn btn-primary btn-sm"
            onClick={handleExportCSV}
            title="Exportar dados das alocações filtradas em formato CSV compatível com Excel"
          >
            <span>📊</span> Exportar CSV (Excel)
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Período */}
      <div className="dashboard-period-bar">
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Período de Análise:
        </span>
        <div className="period-pills-container">
          <button 
            className={`period-pill ${tipoPeriodo === 'mes_atual' ? 'active' : ''}`}
            onClick={() => setTipoPeriodo('mes_atual')}
          >
            Mês Atual
          </button>
          <button 
            className={`period-pill ${tipoPeriodo === 'proximo_mes' ? 'active' : ''}`}
            onClick={() => setTipoPeriodo('proximo_mes')}
          >
            Próximo Mês
          </button>
          <button 
            className={`period-pill ${tipoPeriodo === 'proximos_30' ? 'active' : ''}`}
            onClick={() => setTipoPeriodo('proximos_30')}
          >
            Próximos 30 Dias
          </button>
          <button 
            className={`period-pill ${tipoPeriodo === 'ultimos_30' ? 'active' : ''}`}
            onClick={() => setTipoPeriodo('ultimos_30')}
          >
            Últimos 30 Dias
          </button>
          <button 
            className={`period-pill ${tipoPeriodo === 'todos' ? 'active' : ''}`}
            onClick={() => setTipoPeriodo('todos')}
          >
            Todo o Histórico
          </button>
          <button 
            className={`period-pill ${tipoPeriodo === 'custom' ? 'active' : ''}`}
            onClick={() => setTipoPeriodo('custom')}
          >
            Personalizado
          </button>
        </div>

        {tipoPeriodo === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
            <input 
              type="date" 
              value={dataInicioCustom} 
              onChange={e => setDataInicioCustom(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.82rem' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>até</span>
            <input 
              type="date" 
              value={dataFimCustom} 
              onChange={e => setDataFimCustom(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.82rem' }}
            />
          </div>
        )}

        {!contarFinaisDeSemana && (
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-medium)' }}>
            <span>🚫 🗓️</span>
            <span>
              <strong>Parâmetro de Sistema:</strong> Finais de semana NÃO são contabilizados no cálculo de horas e ocupação (apenas dias úteis Seg-Sex)
              {alocacoesFdsDesconsideradas > 0 ? ` — ${alocacoesFdsDesconsideradas} alocação(ões) em sábado/domingo desconsiderada(s) destas métricas` : ''}.
            </span>
          </div>
        )}
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
            ⏱️
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Horas Alocadas</span>
            <strong className="kpi-value">{totalHoras}h</strong>
            <span className="kpi-subtext">{alocacoesPeriodo.length} registros no período</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            ⚡
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ocupação da Equipe</span>
            <strong className="kpi-value">{taxaOcupacaoGeral}%</strong>
            <span className="kpi-subtext">
              Capacidade Real: {capacidadeRealDisponivel}h {horasAusenciasNoPeriodo > 0 ? `(-${horasAusenciasNoPeriodo}h em ausências)` : `(${diasUteisNoPeriodo} dias úteis)`}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            🏖️
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Férias & Ausências</span>
            <strong className="kpi-value">{horasAusenciasNoPeriodo}h</strong>
            <span className="kpi-subtext">
              {horasAusenciasNoPeriodo > 0 
                ? `${horasAusenciasNoPeriodo / 8} dia(s)-homem descontado(s)`
                : 'Nenhuma ausência no período'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--info)' }}>
            📁
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Projetos com Demanda</span>
            <strong className="kpi-value">
              {metricasProjetos.filter(p => p.horas > 0).length} / {projetos.length}
            </strong>
            <span className="kpi-subtext">Projetos recebendo esforço</span>
          </div>
        </div>

        <div className="kpi-card">
          <div 
            className="kpi-icon" 
            style={{ 
              background: sobrecargas.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
              color: sobrecargas.length > 0 ? 'var(--danger)' : 'var(--success)' 
            }}
          >
            {sobrecargas.length > 0 ? '⚠️' : '✅'}
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Casos de Sobrecarga</span>
            <strong className="kpi-value" style={{ color: sobrecargas.length > 0 ? 'var(--danger)' : 'inherit' }}>
              {sobrecargas.length}
            </strong>
            <span className="kpi-subtext">
              {sobrecargas.length > 0 ? 'Dias com alocação > 8h' : 'Equipe em conformidade (≤ 8h)'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta Detalhado de Sobrecarga (se houver) */}
      {sobrecargas.length > 0 && (
        <div className="overload-alert-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <strong style={{ color: 'var(--danger)' }}>Alertas de Conflito de Jornada Identificados:</strong>
          </div>
          <div className="overload-items-list">
            {sobrecargas.map((s, idx) => {
              const dev = programadores.find(p => p.id === s.programadorId);
              return (
                <div key={idx} className="overload-item-chip">
                  <span className="prog-dot" style={{ backgroundColor: dev?.cor || '#EF4444' }} />
                  <strong>{dev?.nome || 'Dev'}:</strong> {s.horasTotais}h no dia {s.data} ({s.alocacoes.length} projetos simultâneos)
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de Gráficos e Distribuição */}
      <div className={`dashboard-grid-two-cols dashboard-zoom-${zoomDashboard}`}>
        {/* Painel 1: Horas por Projeto */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Distribuição de Esforço por Projeto</h3>
            <span className="panel-badge">{metricasProjetos.filter(p => p.horas > 0).length} ativos</span>
          </div>

          <div className="project-bars-container">
            {metricasProjetos.filter(p => p.horas > 0).length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
                Nenhuma alocação registrada para este período.
              </p>
            ) : (
              metricasProjetos.map(proj => {
                if (proj.horas === 0) return null;
                return (
                  <div key={proj.id} className="project-bar-item">
                    <div className="project-bar-labels">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="folder-icon" style={{ fontSize: '0.9rem' }}>📁</span>
                        <strong>{proj.nome}</strong>
                        <span className="text-muted text-sm">({proj.devsCount} dev{proj.devsCount > 1 ? 's' : ''})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{proj.horas}h</span>
                        <span className="text-muted text-sm">{proj.percentual}%</span>
                      </div>
                    </div>

                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${proj.percentual}%` }}
                        title={`${proj.nome}: ${proj.horas}h (${proj.percentual}%)`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel 2: Capacidade e Dedicação por Desenvolvedor */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Dedicação e Capacidade por Desenvolvedor</h3>
            <span className="panel-badge">{programadores.length} devs</span>
          </div>

          <div className="devs-capacity-list">
            {metricasProgramadores.map(prog => {
              return (
                <div key={prog.id} className="dev-capacity-row">
                  <div className="dev-capacity-left">
                    <div 
                      className="avatar-circle-sm" 
                      style={{ backgroundColor: prog.cor }}
                      title={`Cor: ${prog.cor}`}
                    >
                      {prog.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="dev-name">{prog.nome}</h4>
                      <span className="dev-subtext">
                        {prog.diasCount} dia{prog.diasCount > 1 ? 's' : ''} alocado{prog.diasCount > 1 ? 's' : ''} ({prog.projetosCount} projeto{prog.projetosCount > 1 ? 's' : ''})
                        {prog.diasAusencia > 0 && (
                          <span style={{ color: 'var(--warning)', marginLeft: '6px', fontWeight: 600 }}>
                            • 🏖️ {prog.diasAusencia}d ausência
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="dev-capacity-center">
                    <div className="progress-bar-bg" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${prog.taxaOcupacao}%`,
                          backgroundColor: prog.temSobrecarga ? 'var(--danger)' : prog.cor
                        }} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>Média: {prog.mediaHorasDia}h/dia</span>
                      <span>{prog.taxaOcupacao}% ({prog.capacidadeIndividual}h disp.)</span>
                    </div>
                  </div>

                  <div className="dev-capacity-right">
                    <strong style={{ fontSize: '0.95rem' }}>{prog.horas}h</strong>
                    <span className={`badge ${prog.statusClass}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {prog.statusCarga}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
