import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const CORES_PORTFOLIO = [
  '#2563EB', '#059669', '#D97706', '#7C3AED', 
  '#DB2777', '#0891B2', '#EA580C', '#4F46E5'
];

export default function PortfolioModal({
  isOpen,
  onClose,
  portfolios = [],
  onSalvarPortfolio,
  onExcluirPortfolio
}) {
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [gestor, setGestor] = useState('');
  const [cor, setCor] = useState('#2563EB');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editando) {
      setNome(editando.nome || '');
      setDescricao(editando.descricao || '');
      setGestor(editando.gestor_responsavel || '');
      setCor(editando.cor || '#2563EB');
    } else {
      setNome('');
      setDescricao('');
      setGestor('');
      setCor('#2563EB');
    }
    setErro('');
  }, [editando, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome do portfólio é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      await onSalvarPortfolio({
        id: editando?.id,
        nome: nome.trim(),
        descricao: descricao.trim(),
        gestor_responsavel: gestor.trim(),
        cor
      });
      setEditando(null);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar portfólio.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id, nomePort) => {
    if (window.confirm(`Tem certeza que deseja excluir o portfólio "${nomePort}"? Os projetos vinculados não serão apagados, apenas ficarão sem portfólio atribuído.`)) {
      try {
        await onExcluirPortfolio(id);
        if (editando?.id === id) setEditando(null);
      } catch (err) {
        alert('Erro ao excluir portfólio: ' + err.message);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestão de Portfólios de Projetos (US-015)"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div className="portfolio-modal-content">
        <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
          Agrupe projetos por unidade de negócio ou departamento corporativo (ex: Financeiro, Saúde, ERP).
          O portfólio selecionado filtrará a Linha do Tempo, Calendário e Dashboard de Indicadores.
        </p>

        {/* Formulário de Criação / Edição */}
        <div className="portfolio-form-card" style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-medium)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{editando ? '✏️' : '➕'}</span>
            <span>{editando ? `Editar Portfólio: ${editando.nome}` : 'Novo Portfólio'}</span>
          </h4>

          {erro && <div className="form-error-alert" style={{ marginBottom: '12px' }}>{erro}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="port-nome" style={{ fontSize: '0.85rem' }}>Nome do Portfólio <span className="required">*</span></label>
                <input
                  id="port-nome"
                  type="text"
                  placeholder="Ex: Benner Gestão Financeira"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="port-gestor" style={{ fontSize: '0.85rem' }}>Gestor Responsável</label>
                <input
                  id="port-gestor"
                  type="text"
                  placeholder="Ex: Carlos Silva ou Equipe Core"
                  value={gestor}
                  onChange={e => setGestor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="port-desc" style={{ fontSize: '0.85rem' }}>Descrição / Escopo</label>
              <input
                id="port-desc"
                type="text"
                placeholder="Ex: Módulos de faturamento, conciliação e relatórios regulatórios"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
            </div>

            {/* Seletor de Cor */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem' }}>Cor de Identificação:</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {CORES_PORTFOLIO.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: cor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      transform: cor === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}
                    title={`Selecionar cor ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={cor}
                  onChange={e => setCor(e.target.value)}
                  style={{ width: '28px', height: '28px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Cor personalizada"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {editando && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditando(null)}
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="submit"
                id="btn-salvar-portfolio"
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (editando ? 'Atualizar Portfólio' : '+ Criar Portfólio')}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Portfólios Cadastrados */}
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Portfólios Cadastrados ({portfolios.length})
        </h4>

        {portfolios.length === 0 ? (
          <p className="text-muted text-sm">Nenhum portfólio cadastrado ainda.</p>
        ) : (
          <div className="portfolios-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {portfolios.map(p => (
              <div
                key={p.id}
                className="portfolio-item-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderLeft: `5px solid ${p.cor || '#2563EB'}`,
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.92rem' }}>{p.nome}</strong>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                      {p.projetos_count || 0} projeto(s)
                    </span>
                  </div>
                  {p.descricao && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.descricao}
                    </div>
                  )}
                  {p.gestor_responsavel && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      👤 Gestor: <strong>{p.gestor_responsavel}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={() => setEditando(p)}
                    title="Editar informações do portfólio"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={() => handleExcluir(p.id, p.nome)}
                    title="Excluir portfólio"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
