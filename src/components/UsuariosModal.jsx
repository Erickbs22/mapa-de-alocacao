import React, { useState } from 'react';
import Modal from './Modal';

export default function UsuariosModal({
  isOpen,
  onClose,
  usuarios = [],
  portfolios = [],
  usuarioLogado,
  onSalvarUsuario,
  onExcluirUsuario
}) {
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('gerente');
  const [portfolioId, setPortfolioId] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const limparFormulario = () => {
    setEditando(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('gerente');
    setPortfolioId('');
    setAtivo(true);
    setErro('');
  };

  const iniciarEdicao = (u) => {
    setEditando(u);
    setNome(u.nome || '');
    setEmail(u.email || '');
    setSenha('');
    setPerfil(u.perfil || 'gerente');
    setPortfolioId(u.portfolio_id ? String(u.portfolio_id) : '');
    setAtivo(Boolean(u.ativo));
    setErro('');
  };

  const handleClose = () => {
    limparFormulario();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      setErro('Nome e e-mail corporativo são obrigatórios.');
      return;
    }
    if (!editando && (!senha || senha.trim().length < 4)) {
      setErro('Informe uma senha inicial de pelo menos 4 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      await onSalvarUsuario({
        id: editando?.id,
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim() ? senha.trim() : undefined,
        perfil,
        portfolio_id: perfil === 'gerente' && portfolioId ? Number(portfolioId) : null,
        ativo: ativo ? 1 : 0
      });
      limparFormulario();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (u) => {
    if (usuarioLogado && u.id === usuarioLogado.id) {
      alert('Você não pode excluir o seu próprio usuário enquanto estiver logado.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${u.nome}" (${u.email})?`)) {
      try {
        await onExcluirUsuario(u.id);
        if (editando?.id === u.id) limparFormulario();
      } catch (err) {
        alert(err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Controle de Usuários & Gerentes de Produto (US-016)"
      footer={
        <button type="button" className="btn btn-secondary" onClick={handleClose}>
          Fechar
        </button>
      }
    >
      <div className="usuarios-modal-content">
        <p className="text-muted text-sm" style={{ marginBottom: '14px' }}>
          Cadastre <strong>Gerentes de Produto (PMs)</strong> vinculados aos seus respectivos Portfólios ou <strong>Administradores</strong> com visão global irrestrita.
        </p>

        {/* Formulário de Criação / Edição */}
        <div
          style={{
            background: 'var(--bg-input)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid var(--border-medium)'
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{editando ? '✏️' : '➕'}</span>
            <span>{editando ? `Editar Usuário: ${editando.nome}` : 'Novo Usuário / Gerente de Produto'}</span>
          </h4>

          {erro && <div className="form-error-alert" style={{ marginBottom: '12px' }}>{erro}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="user-nome" style={{ fontSize: '0.82rem' }}>
                  Nome Completo <span className="required">*</span>
                </label>
                <input
                  id="user-nome"
                  type="text"
                  placeholder="Ex: Juliana Mendes"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="user-email" style={{ fontSize: '0.82rem' }}>
                  E-mail Corporativo <span className="required">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  placeholder="juliana.mendes@benner.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="user-perfil" style={{ fontSize: '0.82rem' }}>
                  Perfil de Acesso <span className="required">*</span>
                </label>
                <select
                  id="user-perfil"
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value)}
                >
                  <option value="gerente">📁 Gerente de Produto (Restrito ao Portfólio)</option>
                  <option value="admin">👑 Administrador (Acesso Total)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="user-portfolio" style={{ fontSize: '0.82rem' }}>
                  Portfólio Vinculado {perfil === 'gerente' && <span className="required">*</span>}
                </label>
                <select
                  id="user-portfolio"
                  value={perfil === 'admin' ? '' : portfolioId}
                  onChange={(e) => setPortfolioId(e.target.value)}
                  disabled={perfil === 'admin'}
                >
                  {perfil === 'admin' ? (
                    <option value="">🌐 Todos os Portfólios (Visão Global)</option>
                  ) : (
                    <>
                      <option value="">Selecione um portfólio...</option>
                      {portfolios.map((pf) => (
                        <option key={pf.id} value={pf.id}>
                          📁 {pf.nome}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end', marginBottom: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="user-senha" style={{ fontSize: '0.82rem' }}>
                  {editando ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                </label>
                <input
                  id="user-senha"
                  type="password"
                  placeholder={editando ? '•••••••• (sem alteração)' : 'Mínimo 4 caracteres'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required={!editando}
                />
              </div>

              <div className="form-group" style={{ margin: 0, paddingBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Usuário Ativo (pode fazer login)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {editando && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={limparFormulario}>
                  Cancelar Edição
                </button>
              )}
              <button id="btn-salvar-usuario" type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Salvando...' : editando ? 'Atualizar Usuário' : '+ Cadastrar Usuário'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Usuários */}
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Usuários Cadastrados ({usuarios.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
          {usuarios.map((u) => {
            const isSelf = usuarioLogado && u.id === usuarioLogado.id;
            return (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderLeft: `4px solid ${u.perfil === 'admin' ? '#2563EB' : u.portfolio_cor || '#059669'}`,
                  borderRadius: 'var(--radius-sm)',
                  opacity: u.ativo ? 1 : 0.6
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{u.nome}</strong>
                    {isSelf && (
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        Você
                      </span>
                    )}
                    <span
                      className={`badge ${u.perfil === 'admin' ? 'badge-info' : 'badge-success'}`}
                      style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                    >
                      {u.perfil === 'admin' ? '👑 Admin' : '📁 Gerente PM'}
                    </span>
                    {!u.ativo && (
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                        Inativo
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ✉️ {u.email}
                    {u.perfil === 'gerente' && (
                      <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>
                        • Portfólio: <strong>{u.portfolio_nome || 'Não atribuído'}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={() => iniciarEdicao(u)}
                    title="Editar usuário"
                  >
                    ✏️ Editar
                  </button>
                  {!isSelf && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleExcluir(u)}
                      title="Excluir usuário"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

