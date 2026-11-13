import React, { useState, useMemo } from 'react';

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

export default function UsuariosView({
  usuarios = [],
  portfolios = [],
  usuarioLogado = null,
  onNovoUsuario,
  onEditarUsuario,
  onExcluirUsuario
}) {
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('todos'); // 'todos', 'admin', 'gerente'
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'ativo', 'inativo'
  const [filtroPortfolio, setFiltroPortfolio] = useState('todos');

  // Contadores para os pills de filtro
  const counts = useMemo(() => {
    const c = {
      total: usuarios.length,
      admin: 0,
      desenvolvedor: 0,
      gerente: 0,
      ativo: 0,
      inativo: 0
    };
    for (const u of usuarios) {
      if (u.perfil === 'admin') c.admin++;
      else if (u.perfil === 'desenvolvedor') c.desenvolvedor++;
      else if (u.perfil === 'gerente') c.gerente++;

      if (u.ativo) c.ativo++;
      else c.inativo++;
    }
    return c;
  }, [usuarios]);

  // Filtragem combinada
  const filtrados = useMemo(() => {
    return usuarios.filter(u => {
      if (filtroPerfil !== 'todos' && u.perfil !== filtroPerfil) return false;
      if (filtroStatus === 'ativo' && !u.ativo) return false;
      if (filtroStatus === 'inativo' && u.ativo) return false;
      if (filtroPortfolio !== 'todos' && String(u.portfolio_id) !== String(filtroPortfolio)) return false;

      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      const matchNome = (u.nome || '').toLowerCase().includes(termo);
      const matchEmail = (u.email || '').toLowerCase().includes(termo);
      const matchPort = (u.portfolio_nome || '').toLowerCase().includes(termo);
      return matchNome || matchEmail || matchPort;
    });
  }, [usuarios, filtroPerfil, filtroStatus, filtroPortfolio, busca]);

  return (
    <div className="view-container">
      {/* Cabeçalho da Visão */}
      <div className="view-header">
        <div>
          <h2>Controle de Usuários ({usuarios.length})</h2>
          <p>
            Cadastre e gerencie as contas de acesso, perfis de Administrador e Gerentes de Produto (PMs) associados aos Portfólios.
          </p>
        </div>
        <button id="btn-novo-usuario" className="btn btn-primary" onClick={onNovoUsuario}>
          <span>+</span> Novo Usuário
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="view-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-box" style={{ flex: '1', minWidth: '280px' }}>
            <input
              id="busca-usuarios"
              type="text"
              placeholder="Buscar usuário por nome, e-mail ou portfólio..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="status-filter-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {portfolios && portfolios.length > 0 && (
              <select
                id="filtro-portfolio-usuarios"
                value={filtroPortfolio}
                onChange={(e) => setFiltroPortfolio(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--border-color, #E2E8F0)',
                  backgroundColor: 'var(--bg-card, #FFFFFF)',
                  color: 'var(--text-main, #0F172A)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <option value="todos">Todos os Portfólios</option>
                {portfolios.map(pf => (
                  <option key={pf.id} value={pf.id}>{pf.nome}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              className={`btn btn-sm ${filtroPerfil === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroPerfil('todos')}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filtroPerfil === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroPerfil('admin')}
            >
              👑 Admins / PM ({counts.admin})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filtroPerfil === 'desenvolvedor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroPerfil('desenvolvedor')}
            >
              👨‍💻 Devs ({counts.desenvolvedor})
            </button>
            {counts.gerente > 0 && (
              <button
                type="button"
                className={`btn btn-sm ${filtroPerfil === 'gerente' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltroPerfil('gerente')}
              >
                📁 Gerentes ({counts.gerente})
              </button>
            )}

            <span style={{ color: 'var(--border-medium)', margin: '0 2px' }}>|</span>

            <button
              type="button"
              className={`btn btn-sm ${filtroStatus === 'ativo' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroStatus(filtroStatus === 'ativo' ? 'todos' : 'ativo')}
              title="Filtrar apenas usuários ativos"
            >
              🟢 Ativos ({counts.ativo})
            </button>
            {counts.inativo > 0 && (
              <button
                type="button"
                className={`btn btn-sm ${filtroStatus === 'inativo' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltroStatus(filtroStatus === 'inativo' ? 'todos' : 'inativo')}
                title="Filtrar apenas usuários inativos"
              >
                🔴 Inativos ({counts.inativo})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grade de Cards de Usuários */}
      <div className="cards-grid">
        {filtrados.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum usuário encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          filtrados.map((u) => {
            const isSelf = usuarioLogado && u.id === usuarioLogado.id;
            const corAvatar = u.perfil === 'admin' 
              ? '#2563EB' 
              : u.perfil === 'desenvolvedor' 
                ? '#0891B2' 
                : (u.portfolio_cor || '#059669');
            const contraste = getContrastColor(corAvatar);
            const iniciais = (u.nome || '')
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'U';

            const perfilLabel = u.perfil === 'admin'
              ? '👑 Administrador (PM/PO)'
              : u.perfil === 'desenvolvedor'
                ? '👨‍💻 Desenvolvedor (Leitura)'
                : '📁 Gerente PM';

            return (
              <div
                key={u.id}
                className="card usuario-card"
                style={{
                  borderLeft: `5px solid ${corAvatar}`,
                  opacity: u.ativo ? 1 : 0.65
                }}
              >
                <div className="card-top">
                  <div
                    className="avatar-circle"
                    style={{ backgroundColor: corAvatar, color: contraste }}
                    title={`Perfil: ${perfilLabel}`}
                  >
                    {iniciais}
                  </div>
                  <div className="card-info">
                    <h3 className="card-title" title={u.nome}>
                      {u.nome}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span className={`badge ${u.perfil === 'admin' ? 'badge-info' : u.perfil === 'desenvolvedor' ? 'badge-secondary' : 'badge-success'}`}>
                        {perfilLabel}
                      </span>
                      {isSelf && (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                          Você
                        </span>
                      )}
                      <span className={`badge ${u.ativo ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                        {u.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✉️</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{u.email}</strong>
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Escopo de Acesso:</span>
                    <div style={{ marginTop: '4px' }}>
                      {u.perfil === 'admin' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563EB',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🌐</span> Acesso Geral (Criação, Edição e Usuários)
                        </span>
                      ) : u.perfil === 'desenvolvedor' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(8, 145, 178, 0.1)',
                            color: '#0891B2',
                            border: '1px solid rgba(8, 145, 178, 0.3)',
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>👁️</span> Visualização e Consumo (Somente Leitura)
                        </span>
                      ) : u.portfolio_nome ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(5, 150, 105, 0.1)',
                            color: u.portfolio_cor || '#059669',
                            border: `1px solid ${u.portfolio_cor || '#059669'}`,
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Gerente responsável pelo portfólio ${u.portfolio_nome}`}
                        >
                          <span>📁</span> {u.portfolio_nome}
                        </span>
                      ) : (
                        <span className="text-muted text-sm" style={{ fontStyle: 'italic' }}>
                          Nenhum portfólio associado
                        </span>
                      )}
                    </div>
                  </div>

                  {u.created_at && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '8px' }}>
                      Cadastrado em: {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    id={`btn-editar-usuario-${u.id}`}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditarUsuario(u)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    id={`btn-excluir-usuario-${u.id}`}
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => onExcluirUsuario(u)}
                    disabled={isSelf}
                    title={isSelf ? 'Você não pode excluir sua própria conta conectada.' : 'Excluir usuário'}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

