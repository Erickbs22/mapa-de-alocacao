import React, { useState } from 'react';
import Modal from './Modal';

export default function AusenciaModal({
  isOpen,
  onClose,
  programadores,
  ausencias,
  programadorPreSelecionado,
  onSalvarAusencia,
  onExcluirAusencia
}) {
  const [programadorId, setProgramadorId] = useState(
    programadorPreSelecionado ? String(programadorPreSelecionado.id) : ''
  );
  const [tipo, setTipo] = useState('ferias');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Sincroniza se abrir com programador pré-selecionado
  React.useEffect(() => {
    if (isOpen) {
      if (programadorPreSelecionado) {
        setProgramadorId(String(programadorPreSelecionado.id));
      } else {
        setProgramadorId('');
      }
      setTipo('ferias');
      setDataInicio('');
      setDataFim('');
      setDescricao('');
      setErro('');
    }
  }, [isOpen, programadorPreSelecionado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!dataInicio || !dataFim) {
      setErro('Preencha a data de início e a data de término da ausência.');
      return;
    }

    if (dataInicio > dataFim) {
      setErro('A data de início deve ser anterior ou igual à data de fim.');
      return;
    }

    if (tipo !== 'feriado' && !programadorId) {
      setErro('Selecione o programador que estará ausente.');
      return;
    }

    try {
      setSalvando(true);
      await onSalvarAusencia({
        programador_id: tipo === 'feriado' && !programadorId ? null : Number(programadorId),
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        descricao: descricao.trim()
      });

      // Limpa campos do formulário
      setDataInicio('');
      setDataFim('');
      setDescricao('');
    } catch (err) {
      setErro(err.message || 'Erro ao salvar ausência.');
    } finally {
      setSalvando(false);
    }
  };

  const getTipoLabel = (t) => {
    switch (t) {
      case 'ferias': return '🏖️ Férias';
      case 'folga': return '🌴 Folga / Recesso';
      case 'licenca': return '🩺 Licença';
      case 'feriado': return '🎉 Feriado Corporativo';
      default: return t;
    }
  };

  const getTipoBadgeClass = (t) => {
    switch (t) {
      case 'ferias': return 'badge-warning';
      case 'folga': return 'badge-info';
      case 'licenca': return 'badge-danger';
      case 'feriado': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  // Filtra as ausências exibidas na listagem (se tiver dev selecionado, foca nele ou globais)
  const ausenciasExibidas = (ausencias || []).filter(a => {
    if (!programadorId) return true;
    return !a.programador_id || String(a.programador_id) === String(programadorId);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestão de Férias, Folgas e Ausências (US-021)"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Formulário de Cadastro */}
        <div style={{
          background: 'var(--bg-input)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-medium)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>➕</span> Registrar Novo Período de Ausência
          </h4>

          {erro && <div className="form-error-alert" style={{ marginBottom: '12px' }}>{erro}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="aus-dev" style={{ fontSize: '0.82rem' }}>
                  Colaborador <span className="required">*</span>
                </label>
                <select
                  id="aus-dev"
                  value={programadorId}
                  onChange={e => setProgramadorId(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="">🎉 Feriado Corporativo Global (Todos)</option>
                  <optgroup label="Colaboradores">
                    {programadores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="aus-tipo" style={{ fontSize: '0.82rem' }}>
                  Tipo de Ausência <span className="required">*</span>
                </label>
                <select
                  id="aus-tipo"
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="ferias">🏖️ Férias</option>
                  <option value="folga">🌴 Folga / Recesso</option>
                  <option value="licenca">🩺 Licença Médica / Outra</option>
                  <option value="feriado">🎉 Feriado Corporativo</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="aus-data-inicio" style={{ fontSize: '0.82rem' }}>
                  Data Início <span className="required">*</span>
                </label>
                <input
                  id="aus-data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="aus-data-fim" style={{ fontSize: '0.82rem' }}>
                  Data Término <span className="required">*</span>
                </label>
                <input
                  id="aus-data-fim"
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="aus-desc" style={{ fontSize: '0.82rem' }}>Observação / Motivo</label>
              <input
                id="aus-desc"
                type="text"
                placeholder="Ex: Férias anuais aprovadas, recesso de final de ano..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="btn-salvar-ausencia"
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Ausência'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Ausências Registradas */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Ausências Cadastradas ({ausenciasExibidas.length})
          </h4>

          {ausenciasExibidas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-sm)'
            }}>
              Nenhuma ausência registrada {programadorId ? 'para este colaborador' : 'no sistema'}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {ausenciasExibidas.map(aus => {
                const dev = programadores.find(p => p.id === aus.programador_id);
                return (
                  <div
                    key={aus.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${getTipoBadgeClass(aus.tipo)}`}>
                        {getTipoLabel(aus.tipo)}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {aus.programador_id ? (dev ? dev.nome : aus.programador_nome) : '🎉 Todos (Feriado Global)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📅 {aus.data_inicio} até {aus.data_fim} {aus.descricao ? `• ${aus.descricao}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-delete-small"
                      onClick={() => {
                        if (window.confirm('Excluir este registro de ausência?')) {
                          onExcluirAusencia(aus.id);
                        }
                      }}
                      title="Excluir ausência"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
