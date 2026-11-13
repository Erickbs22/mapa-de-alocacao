import React, { useState, useMemo } from 'react';
import Modal from './Modal';

export default function PlanejarAlocacoesModal({
  isOpen,
  onClose,
  programador,
  projetos,
  alocacoes,
  ausencias = [],
  onSalvarPeriodo,
  onExcluirAlocacao
}) {
  const [projetoId, setProjetoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [apenasDiasUteis, setApenasDiasUteis] = useState(true);
  const [diaTodo, setDiaTodo] = useState(true);
  const [horas, setHoras] = useState(8);
  const [observacao, setObservacao] = useState('');
  const [modoConflito, setModoConflito] = useState('somar'); // 'somar' ou 'substituir_tudo'
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Agrupamento de projetos por status (US-022)
  const { projetosAtivos, projetosPausados, projetosConcluidos } = useMemo(() => {
    return {
      projetosAtivos: (projetos || []).filter(p => (p.status || 'ativo') === 'ativo'),
      projetosPausados: (projetos || []).filter(p => p.status === 'pausado'),
      projetosConcluidos: (projetos || []).filter(p => p.status === 'concluido')
    };
  }, [projetos]);

  // Alocações existentes pertencentes a este desenvolvedor (ordenadas por data)
  const alocacoesDoDev = useMemo(() => {
    if (!programador) return [];
    return alocacoes
      .filter(a => a.programador_id === programador.id)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [alocacoes, programador]);

  // Simulação em tempo real do período escolhido
  const simulacao = useMemo(() => {
    if (!dataInicio || !dataFim || dataInicio > dataFim) {
      return { diasValidos: [], totalHoras: 0, conflitos: [] };
    }

    const cur = new Date(dataInicio + 'T00:00:00');
    const end = new Date(dataFim + 'T00:00:00');
    const diasValidos = [];
    const conflitos = [];
    const diasEmAusencia = [];

    const horasDestaAloc = diaTodo ? 8 : (Number(horas) || 8);

    while (cur <= end) {
      const day = cur.getDay(); // 0 = Dom, 6 = Sab
      if (!apenasDiasUteis || (day !== 0 && day !== 6)) {
        const iso = cur.toISOString().split('T')[0];
        diasValidos.push(iso);

        // Verifica se há ausência/férias nesta data (US-021)
        const ausenciaNestaData = ausencias.find(a => {
          const matchDev = !a.programador_id || String(a.programador_id) === String(programador?.id);
          return matchDev && iso >= a.data_inicio && iso <= a.data_fim;
        });
        if (ausenciaNestaData) {
          diasEmAusencia.push({
            data: iso,
            tipo: ausenciaNestaData.tipo,
            descricao: ausenciaNestaData.descricao
          });
        }

        // Verifica se o dev já tem horas nessa data em outros projetos
        const horasJaAlocadas = alocacoesDoDev
          .filter(a => a.data === iso && (modoConflito === 'substituir_tudo' ? false : String(a.projeto_id) !== String(projetoId)))
          .reduce((acc, curr) => acc + (Number(curr.horas) || 8), 0);

        if (horasJaAlocadas + horasDestaAloc > 8) {
          conflitos.push({
            data: iso,
            horasExistentes: horasJaAlocadas,
            horasNovas: horasDestaAloc,
            totalPrevisto: horasJaAlocadas + horasDestaAloc
          });
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    return {
      diasValidos,
      totalHoras: diasValidos.length * horasDestaAloc,
      conflitos,
      diasEmAusencia
    };
  }, [dataInicio, dataFim, apenasDiasUteis, diaTodo, horas, alocacoesDoDev, projetoId, modoConflito, ausencias, programador]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projetoId) {
      setErro('Selecione o projeto de destino.');
      return;
    }
    if (!dataInicio || !dataFim) {
      setErro('Informe a data inicial e final do período.');
      return;
    }
    if (dataInicio > dataFim) {
      setErro('A data inicial não pode ser posterior à data final.');
      return;
    }
    if (simulacao.diasValidos.length === 0) {
      setErro('Nenhum dia elegível no intervalo selecionado (verifique a opção de dias úteis).');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      await onSalvarPeriodo({
        programador_id: programador.id,
        projeto_id: Number(projetoId),
        data_inicio: dataInicio,
        data_fim: dataFim,
        apenas_dias_uteis: apenasDiasUteis,
        dia_todo: diaTodo,
        horas: diaTodo ? 8 : Number(horas),
        observacao: observacao.trim(),
        modo_conflito: modoConflito
      });

      // Limpar campos de datas para permitir agendar outro período/projeto
      setDataInicio('');
      setDataFim('');
      setObservacao('');
    } catch (err) {
      setErro(err.message || 'Erro ao registrar alocações no período.');
    } finally {
      setLoading(false);
    }
  };

  if (!programador) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Planejamento de Alocações — ${programador.nome}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Concluir / Fechar
          </button>
        </div>
      }
    >
      <div className="planejar-alocacoes-container">
        {/* Cabeçalho do Programador */}
        <div className="dev-planning-header">
          <div 
            className="avatar-circle" 
            style={{ backgroundColor: programador.cor, width: '44px', height: '44px', fontSize: '1rem' }}
          >
            {programador.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {programador.nome}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {programador.email || 'Sem e-mail cadastrado'} • {alocacoesDoDev.length} alocação(ões) ativa(s)
            </span>
          </div>
        </div>

        {erro && <div className="form-error-alert" style={{ marginTop: '12px' }}>{erro}</div>}

        <div className="planning-split-layout">
          {/* Lado Esquerdo: Formulário de Período */}
          <div className="planning-form-col">
            <h4 className="planning-section-title">
              <span>📅</span> Definir Alocação por Período
            </h4>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="plan-projeto">Projeto <span className="required">*</span></label>
                <select
                  id="plan-projeto"
                  value={projetoId}
                  onChange={e => setProjetoId(e.target.value)}
                  required
                >
                  <option value="">Selecione o projeto...</option>
                  {projetosAtivos.length > 0 && (
                    <optgroup label="🟢 Projetos Ativos">
                      {projetosAtivos.map(proj => (
                        <option key={proj.id} value={proj.id}>
                          {proj.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {projetosPausados.length > 0 && (
                    <optgroup label="⏸️ Projetos Pausados">
                      {projetosPausados.map(proj => (
                        <option key={proj.id} value={proj.id}>
                          {proj.nome} (Pausado)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {projetosConcluidos.length > 0 && (
                    <optgroup label="✓ Projetos Concluídos">
                      {projetosConcluidos.map(proj => (
                        <option key={proj.id} value={proj.id}>
                          {proj.nome} (Concluído)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label htmlFor="plan-data-inicio">Data Início <span className="required">*</span></label>
                  <input
                    id="plan-data-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="plan-data-fim">Data Fim <span className="required">*</span></label>
                  <input
                    id="plan-data-fim"
                    type="date"
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={apenasDiasUteis}
                    onChange={e => setApenasDiasUteis(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Apenas dias úteis (Segunda a Sexta-feira)</span>
                </label>
              </div>

              <div className="form-group" style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={diaTodo}
                    onChange={e => setDiaTodo(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <strong>Dia todo (8 horas por dia)</strong>
                </label>

                {!diaTodo && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="plan-horas" style={{ margin: 0, fontSize: '0.82rem' }}>Horas/dia:</label>
                    <input
                      id="plan-horas"
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={horas}
                      onChange={e => setHoras(e.target.value)}
                      style={{ width: '80px', padding: '4px 8px', fontSize: '0.85rem' }}
                      required
                    />
                    <span className="text-muted text-sm">horas por dia</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="plan-modo-conflito" style={{ fontSize: '0.85rem' }}>Se houver alocação existente no mesmo dia:</label>
                <select
                  id="plan-modo-conflito"
                  value={modoConflito}
                  onChange={e => setModoConflito(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="somar">Somar dedicação (com alerta se passar de 8h)</option>
                  <option value="substituir_tudo">Substituir alocações anteriores nestes dias</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="plan-obs" style={{ fontSize: '0.85rem' }}>Observações (opcional)</label>
                <input
                  id="plan-obs"
                  type="text"
                  placeholder="Ex: Fase de homologação, Sprint 2..."
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
              </div>

              {/* Simulação em Tempo Real */}
              {dataInicio && dataFim && (
                <div className="simulation-preview-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>
                      📋 <strong>{simulacao.diasValidos.length} dia(s)</strong> elegível(is)
                    </span>
                    <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                      Total: {simulacao.totalHoras}h
                    </strong>
                  </div>

                  {simulacao.conflitos.length > 0 && (
                    <div className="sim-warning-msg" style={{ marginTop: '8px' }}>
                      ⚠️ <strong>Alerta de Sobrecarga:</strong> Em {simulacao.conflitos.length} dia(s), este desenvolvedor ultrapassará 8h diárias de jornada acumulada.
                    </div>
                  )}

                  {simulacao.diasEmAusencia && simulacao.diasEmAusencia.length > 0 && (
                    <div className="sim-warning-msg" style={{ marginTop: '8px', background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>
                      🏖️ <strong>Ausência / Férias no Período:</strong> Há {simulacao.diasEmAusencia.length} dia(s) com ausência ou feriado cadastrado para este colaborador ({simulacao.diasEmAusencia.map(d => d.data).slice(0, 3).join(', ')}{simulacao.diasEmAusencia.length > 3 ? '...' : ''}).
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                id="btn-aplicar-alocacao-periodo"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
                disabled={loading || !projetoId || !dataInicio || !dataFim || simulacao.diasValidos.length === 0}
              >
                {loading ? 'Aplicando...' : `+ Aplicar Alocações no Período`}
              </button>
            </form>
          </div>

          {/* Lado Direito: Agenda e Alocações Atuais do Desenvolvedor */}
          <div className="planning-agenda-col">
            <h4 className="planning-section-title">
              <span>📋</span> Agenda Atual do Desenvolvedor ({alocacoesDoDev.length})
            </h4>

            {alocacoesDoDev.length === 0 ? (
              <div className="empty-agenda-box">
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>🏖️</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Nenhuma alocação registrada para este desenvolvedor.
                </p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Use o formulário ao lado para alocá-lo em um ou mais projetos!
                </span>
              </div>
            ) : (
              <div className="dev-agenda-list">
                {alocacoesDoDev.map(aloc => {
                  const proj = projetos.find(p => p.id === aloc.projeto_id);
                  const d = new Date(aloc.data + 'T00:00:00');
                  const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' });
                  const dataBr = aloc.data.split('-').reverse().join('/');

                  return (
                    <div key={aloc.id} className="agenda-item-card">
                      <div className="agenda-item-left">
                        <span className="agenda-date-badge">{dataBr} ({diaSemana})</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span className="folder-icon" style={{ fontSize: '0.75rem' }}>📁</span>
                          <strong className="agenda-proj-title">{proj?.nome || aloc.projeto_nome || 'Projeto'}</strong>
                        </div>
                        {aloc.observacao && (
                          <span className="agenda-item-obs">"{aloc.observacao}"</span>
                        )}
                      </div>

                      <div className="agenda-item-right">
                        <span className="agenda-hours-pill">{aloc.horas}h</span>
                        <button
                          type="button"
                          className="btn-delete-small"
                          onClick={() => {
                            if (window.confirm(`Remover alocação de ${dataBr}?`)) {
                              onExcluirAlocacao(aloc.id);
                            }
                          }}
                          title="Excluir alocação deste dia"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
