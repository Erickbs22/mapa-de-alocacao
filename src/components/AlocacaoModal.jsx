import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';

export default function AlocacaoModal({
  isOpen,
  onClose,
  alocacao,
  dadosIniciais,
  programadores,
  projetos,
  alocacoesExistentes,
  ausencias = [],
  onSalvar,
  onExcluir,
  isReadOnly = false,
  contarFinaisDeSemana = false
}) {
  const isEditing = !!alocacao?.id;

  const [programadorId, setProgramadorId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [data, setData] = useState('');
  const [diaTodo, setDiaTodo] = useState(true);
  const [horas, setHoras] = useState(8);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  // Agrupamento de projetos por status (US-022)
  const { projetosAtivos, projetosPausados, projetosConcluidos } = useMemo(() => {
    return {
      projetosAtivos: (projetos || []).filter(p => (p.status || 'ativo') === 'ativo'),
      projetosPausados: (projetos || []).filter(p => p.status === 'pausado'),
      projetosConcluidos: (projetos || []).filter(p => p.status === 'concluido')
    };
  }, [projetos]);

  // Verificação de ausência / férias do programador na data selecionada (US-021 Cenário 3)
  const ausenciaConflito = useMemo(() => {
    if (!data || !programadorId || !ausencias || ausencias.length === 0) return null;
    return ausencias.find(a => {
      const matchDev = !a.programador_id || String(a.programador_id) === String(programadorId);
      return matchDev && data >= a.data_inicio && data <= a.data_fim;
    });
  }, [data, programadorId, ausencias]);

  // Detecção se a data selecionada cai em sábado ou domingo
  const isFimDeSemana = useMemo(() => {
    if (!data) return false;
    const d = new Date(data + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  }, [data]);

  // Ao abrir o modal, inicializa os dados
  useEffect(() => {
    if (isOpen) {
      setErro('');
      if (isEditing) {
        setProgramadorId(alocacao.programador_id || '');
        setProjetoId(alocacao.projeto_id || '');
        setData(alocacao.data || '');
        setDiaTodo(Boolean(alocacao.dia_todo));
        setHoras(alocacao.horas || 8);
        setObservacao(alocacao.observacao || '');
      } else {
        // Nova alocação (com possíveis dados pré-selecionados ao clicar na célula)
        setProgramadorId(dadosIniciais?.programador_id || (programadores[0]?.id ? String(programadores[0].id) : ''));
        setProjetoId(dadosIniciais?.projeto_id || (projetos[0]?.id ? String(projetos[0].id) : ''));
        setData(dadosIniciais?.data || new Date().toISOString().split('T')[0]);
        setDiaTodo(true);
        setHoras(8);
        setObservacao('');
      }
    }
  }, [isOpen, alocacao, dadosIniciais, isEditing, programadores, projetos]);

  // Se marcar "dia todo", força 8h
  const handleToggleDiaTodo = (e) => {
    const checked = e.target.checked;
    setDiaTodo(checked);
    if (checked) {
      setHoras(8);
    }
  };

  // Cálculo de horas já alocadas no dia para o programador selecionado
  const devSelecionado = programadores.find(p => String(p.id) === String(programadorId));
  
  const horasOutrasAlocacoesNoDia = (alocacoesExistentes || [])
    .filter(a => String(a.programador_id) === String(programadorId) && a.data === data && (!isEditing || a.id !== alocacao.id))
    .reduce((acc, curr) => acc + (Number(curr.horas) || 8), 0);

  const horasAtuais = diaTodo ? 8 : (Number(horas) || 0);
  const horasTotaisPrevistas = horasOutrasAlocacoesNoDia + horasAtuais;
  const vaiCausarSobrecarga = horasTotaisPrevistas > 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!programadorId) {
      setErro('Selecione um programador.');
      return;
    }
    if (!projetoId) {
      setErro('Selecione um projeto.');
      return;
    }
    if (!data) {
      setErro('Informe a data da alocação.');
      return;
    }

    // Verifica se já existe alocação idêntica no mesmo projeto, dev e data (exceto o próprio registro em edição)
    const jaExisteNoMesmoProjeto = (alocacoesExistentes || []).some(
      a => String(a.programador_id) === String(programadorId) &&
           String(a.projeto_id) === String(projetoId) &&
           a.data === data &&
           (!isEditing || a.id !== alocacao?.id)
    );

    if (jaExisteNoMesmoProjeto) {
      setErro('Este programador já possui uma alocação neste projeto nesta data. Edite aquela alocação ou escolha outra data/projeto.');
      return;
    }

    const payload = {
      id: isEditing ? alocacao.id : undefined,
      programador_id: Number(programadorId),
      projeto_id: Number(projetoId),
      data,
      dia_todo: diaTodo ? 1 : 0,
      horas: diaTodo ? 8 : Number(horas),
      observacao: observacao.trim()
    };

    try {
      await onSalvar(payload);
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar alocação.');
    }
  };

  const handleExcluirClick = () => {
    if (window.confirm('Tem certeza que deseja excluir esta alocação?')) {
      onExcluir(alocacao.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? 'Detalhes da Alocação (Visualização)' : isEditing ? 'Editar Alocação de Programador' : 'Nova Alocação de Programador'}
      footer={
        <div style={{ display: 'flex', justifyContent: isReadOnly ? 'flex-end' : 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            {!isReadOnly && isEditing && (
              <button 
                id="btn-excluir-alocacao" 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleExcluirClick}
              >
                Excluir Alocação
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button id="btn-salvar-alocacao" type="button" className="btn btn-primary" onClick={handleSubmit}>
                {isEditing ? 'Salvar Alterações' : 'Criar Alocação'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {erro && <div className="form-error-alert">{erro}</div>}

        {isReadOnly && (
          <div style={{ 
            marginBottom: '14px', 
            padding: '10px 14px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'rgba(8, 145, 178, 0.12)',
            border: '1px solid rgba(8, 145, 178, 0.4)',
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>👁️</span>
            <div>
              <strong>Modo Consulta (Desenvolvedor):</strong> Você possui permissão de leitura para acompanhar suas alocações e demandas de projeto. Edições e exclusões são restritas a PM/PO.
            </div>
          </div>
        )}

        {!contarFinaisDeSemana && isFimDeSemana && (
          <div style={{ 
            marginBottom: '14px', 
            padding: '10px 14px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid var(--warning)',
            color: 'var(--text-primary)',
            fontSize: '0.83rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🗓️</span>
            <div>
              <strong>Parâmetro de Fim de Semana Ativo:</strong> Esta data é um final de semana. O sistema está configurado para <strong>não contabilizar finais de semana</strong> nos cálculos de alocação oficial.
            </div>
          </div>
        )}

        {!isReadOnly && isEditing && (
          <div style={{ 
            marginBottom: '14px', 
            padding: '8px 12px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'var(--slot-hover)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>Dica de Reatribuição:</strong> Você pode transferir esta alocação para outro desenvolvedor, mudar o projeto de destino ou alterar a data diretamente abaixo.
          </div>
        )}

        {/* Seleção do Projeto */}
        <div className="form-group">
          <label htmlFor="aloc-projeto">Projeto <span className="required">*</span></label>
          <select
            id="aloc-projeto"
            value={projetoId}
            disabled={isReadOnly}
            onChange={e => {
              setProjetoId(e.target.value);
              setErro('');
            }}
            required
          >
            <option value="">Selecione um projeto...</option>
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

        {/* Seleção do Programador */}
        <div className="form-group">
          <label htmlFor="aloc-programador">Programador <span className="required">*</span></label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {devSelecionado && (
              <span 
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: devSelecionado.cor,
                  display: 'inline-block',
                  flexShrink: 0
                }} 
              />
            )}
            <select
              id="aloc-programador"
              value={programadorId}
              disabled={isReadOnly}
              onChange={e => {
                setProgramadorId(e.target.value);
                setErro('');
              }}
              style={{ flex: 1 }}
              required
            >
              <option value="">Selecione o programador...</option>
              {programadores.map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data da Alocação */}
        <div className="form-group">
          <label htmlFor="aloc-data">Data da Alocação <span className="required">*</span></label>
          <input
            id="aloc-data"
            type="date"
            value={data}
            disabled={isReadOnly}
            onChange={e => {
              setData(e.target.value);
              setErro('');
            }}
            required
          />
        </div>

        {/* Alerta Preventivo de Ausência / Férias (US-021 Cenário 3) */}
        {ausenciaConflito && (
          <div className="form-warning-alert" style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            border: '1px solid var(--warning)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4
          }}>
            <span style={{ fontSize: '1.1rem' }}>🏖️</span>
            <div>
              <strong>Atenção à Ausência Programada:</strong> {devSelecionado?.nome || 'O colaborador'} está em período de <strong>{ausenciaConflito.tipo.toUpperCase()}</strong> ({ausenciaConflito.data_inicio} até {ausenciaConflito.data_fim}).
              {ausenciaConflito.descricao ? ` Motivo: "${ausenciaConflito.descricao}".` : ''}
              <div style={{ marginTop: '4px', fontSize: '0.78rem', opacity: 0.9 }}>
                Você pode salvar esta alocação se for uma exceção, mas fique ciente da indisponibilidade.
              </div>
            </div>
          </div>
        )}

        {/* Tipo de Dedicação: Dia todo vs Parcial */}
        <div className="form-group" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isReadOnly ? 'default' : 'pointer', margin: 0 }}>
            <input
              id="aloc-dia-todo"
              type="checkbox"
              checked={diaTodo}
              disabled={isReadOnly}
              onChange={handleToggleDiaTodo}
              style={{ width: '18px', height: '18px', cursor: isReadOnly ? 'default' : 'pointer' }}
            />
            <span style={{ fontWeight: 600 }}>Alocação Integral (Dia Todo — 8 Horas)</span>
          </label>

          {!diaTodo && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label htmlFor="aloc-horas" style={{ margin: 0, fontSize: '0.9rem' }}>Horas de dedicação:</label>
              <input
                id="aloc-horas"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={horas}
                disabled={isReadOnly}
                onChange={e => setHoras(e.target.value)}
                style={{ width: '90px', padding: '6px 10px' }}
                required
              />
              <span className="text-muted text-sm">horas no dia</span>
            </div>
          )}
        </div>

        {/* Alerta inteligente de sobrecarga se > 8h */}
        {vaiCausarSobrecarga && (
          <div 
            className="warning-alert-box"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: '#FCA5A5',
              fontSize: '0.85rem',
              marginTop: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Alerta de Sobrecarga (RN-05):</strong> O programador terá um total de <strong>{horasTotaisPrevistas}h</strong> alocadas nesta data ({horasOutrasAlocacoesNoDia}h em outros projetos + {horasAtuais}h nesta alocação).
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="form-group" style={{ marginTop: '14px' }}>
          <label htmlFor="aloc-observacao">Observações / Detalhes da Tarefa (opcional)</label>
          <textarea
            id="aloc-observacao"
            rows={2}
            placeholder="Ex: Foco no módulo de conciliação bancária, testes unitários, etc."
            value={observacao}
            disabled={isReadOnly}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
