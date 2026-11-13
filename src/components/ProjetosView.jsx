import React, { useState, useMemo } from 'react';
import Modal from './Modal';

export default function ProjetosView({ 
  projetos, 
  portfolios = [],
  portfolioAtivoId = '',
  usuarioLogado = null,
  onSalvarProjeto, 
  onExcluirProjeto 
}) {
  const isDesenvolvedor = usuarioLogado?.perfil === 'desenvolvedor';
  const isGerenteRestrito = usuarioLogado && usuarioLogado.perfil === 'gerente' && usuarioLogado.portfolio_id;
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  // Estado do formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('ativo');
  const [portfolioId, setPortfolioId] = useState('');
  const [links, setLinks] = useState([]); // [{ rotulo, url }]
  const [erro, setErro] = useState('');

  // Abrir modal novo
  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setDescricao('');
    setStatus('ativo');
    setPortfolioId(isGerenteRestrito ? String(usuarioLogado.portfolio_id) : (portfolioAtivoId ? String(portfolioAtivoId) : ''));
    setLinks([{ rotulo: 'Pasta SharePoint', url: '' }]);
    setErro('');
    setModalAberto(true);
  };

  // Abrir modal edição
  const abrirEditar = (proj) => {
    setEditando(proj);
    setNome(proj.nome);
    setDescricao(proj.descricao || '');
    setStatus(proj.status || 'ativo');
    setPortfolioId(proj.portfolio_id ? String(proj.portfolio_id) : '');
    setLinks(proj.links && proj.links.length > 0 ? [...proj.links] : [{ rotulo: 'Pasta SharePoint', url: '' }]);
    setErro('');
    setModalAberto(true);
  };

  // Gerenciamento dinâmico de links no formulário
  const adicionarLink = () => {
    setLinks([...links, { rotulo: '', url: '' }]);
  };

  const removerLink = (index) => {
    const novos = links.filter((_, i) => i !== index);
    setLinks(novos);
  };

  const atualizarLink = (index, campo, valor) => {
    const novos = [...links];
    novos[index][campo] = valor;
    setLinks(novos);
  };

  // Submeter formulário (P-02: nome obrigatório)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome do projeto é obrigatório.');
      return;
    }

    // Filtrar links vazios
    const linksValidos = links
      .filter(l => l.url && l.url.trim())
      .map(l => ({
        rotulo: l.rotulo?.trim() || 'Link do Projeto',
        url: l.url.trim()
      }));

    try {
      await onSalvarProjeto({
        id: editando ? editando.id : undefined,
        nome: nome.trim(),
        descricao: descricao.trim(),
        status,
        portfolio_id: portfolioId ? Number(portfolioId) : null,
        links: linksValidos
      });
      setModalAberto(false);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar projeto.');
    }
  };

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPortfolio, setFiltroPortfolio] = useState('todos');

  // Contadores de status (US-022)
  const counts = useMemo(() => {
    const c = { total: projetos.length, ativo: 0, pausado: 0, concluido: 0 };
    for (const p of projetos) {
      const s = p.status || 'ativo';
      if (c[s] !== undefined) c[s]++;
      else c.ativo++;
    }
    return c;
  }, [projetos]);

  // Filtragem combinada por busca, status e portfólio (US-015, US-022)
  const filtrados = useMemo(() => {
    return projetos.filter(p => {
      const pStatus = p.status || 'ativo';
      if (filtroStatus !== 'todos' && pStatus !== filtroStatus) return false;
      if (filtroPortfolio !== 'todos' && String(p.portfolio_id) !== String(filtroPortfolio)) return false;
      const termo = busca.toLowerCase();
      return p.nome.toLowerCase().includes(termo) || 
             (p.descricao && p.descricao.toLowerCase().includes(termo));
    });
  }, [projetos, filtroStatus, filtroPortfolio, busca]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Projetos ({projetos.length})</h2>
          <p>Cadastre os projetos ativos e vincule links de pastas no SharePoint ou repositórios.</p>
        </div>
        {!isDesenvolvedor && (
          <button id="btn-novo-projeto" className="btn btn-primary" onClick={abrirNovo}>
            <span>+</span> Novo Projeto
          </button>
        )}
      </div>

      <div className="view-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-box" style={{ flex: '1', minWidth: '260px' }}>
            <input 
              id="busca-projetos"
              type="text" 
              placeholder="Buscar por nome ou descrição do projeto..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {/* Tabs de Filtro de Status (US-022) */}
          <div className="status-filter-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {portfolios && portfolios.length > 0 && (
              <select
                id="filtro-portfolio-projetos"
                value={filtroPortfolio}
                onChange={e => setFiltroPortfolio(e.target.value)}
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
              className={`btn btn-sm ${filtroStatus === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroStatus('todos')}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filtroStatus === 'ativo' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroStatus('ativo')}
            >
              🟢 Ativos ({counts.ativo})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filtroStatus === 'pausado' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroStatus('pausado')}
            >
              ⏸️ Pausados ({counts.pausado})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filtroStatus === 'concluido' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltroStatus('concluido')}
            >
              ✓ Concluídos ({counts.concluido})
            </button>
          </div>
        </div>
      </div>

      <div className="cards-grid">
        {filtrados.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum projeto encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          filtrados.map(proj => {
            return (
              <div key={proj.id} className="card projeto-card">
                <div className="card-top">
                  <div className="projeto-icon">
                    📁
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">{proj.nome}</h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span className={`badge ${
                        proj.status === 'ativo' ? 'badge-success' : 
                        proj.status === 'pausado' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {proj.status === 'ativo' ? '🟢 Ativo' : 
                         proj.status === 'pausado' ? '⏸️ Pausado' : '✓ Concluído'}
                      </span>

                      {proj.portfolio_nome && (
                        <span 
                          className="badge" 
                          style={{ 
                            background: 'rgba(59, 130, 246, 0.12)', 
                            color: proj.portfolio_cor || 'var(--primary)',
                            border: `1px solid ${proj.portfolio_cor || 'var(--primary)'}`,
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Portfólio: ${proj.portfolio_nome}`}
                        >
                          <span>📁</span> {proj.portfolio_nome}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <p className="projeto-descricao">
                    {proj.descricao || 'Nenhuma descrição detalhada informada.'}
                  </p>

                  <div className="links-section">
                    <h4 className="links-title">
                      <span>🔗</span> Links Associados ({proj.links?.length || 0})
                    </h4>
                    {proj.links && proj.links.length > 0 ? (
                      <div className="links-list">
                        {proj.links.map(link => (
                          <a 
                            key={link.id || link.url}
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="link-item-chip"
                            title={link.url}
                          >
                            <span className="link-icon">🌐</span>
                            <span className="link-label">{link.rotulo || 'Link'}</span>
                            <span className="external-arrow">↗</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-sm">Nenhum link associado</span>
                    )}
                  </div>
                </div>

                {!isDesenvolvedor && (
                  <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {proj.status === 'ativo' ? (
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSalvarProjeto({ ...proj, status: 'pausado' })}
                          title="Pausar projeto temporariamente (oculta das visões operacionais)"
                        >
                          ⏸️ Pausar
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSalvarProjeto({ ...proj, status: 'ativo' })}
                          title="Reativar projeto"
                        >
                          ▶️ Ativar
                        </button>
                      )}
                      {proj.status !== 'concluido' && (
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSalvarProjeto({ ...proj, status: 'concluido' })}
                          title="Marcar projeto como concluído"
                        >
                          ✓ Concluir
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        id={`btn-editar-proj-${proj.id}`}
                        className="btn btn-secondary btn-sm" 
                        onClick={() => abrirEditar(proj)}
                      >
                        Editar
                      </button>
                      <button 
                        id={`btn-excluir-proj-${proj.id}`}
                        className="btn btn-danger btn-sm" 
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir o projeto "${proj.nome}"? Todas as suas alocações serão removidas.`)) {
                            onExcluirProjeto(proj.id);
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição de Projeto (US-002, US-003) */}
      <Modal 
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Projeto' : 'Novo Projeto'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button id="btn-salvar-projeto" type="button" className="btn btn-primary" onClick={handleSubmit}>
              Salvar Projeto
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {erro && <div className="form-error-alert">{erro}</div>}

          <div className="form-group">
            <label htmlFor="proj-nome">
              Nome do Projeto <span className="required">*</span>
            </label>
            <input 
              id="proj-nome"
              type="text" 
              placeholder="Ex: Benner Finance - Core"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoFocus
              required
            />
            <span className="form-helper">Identificação principal do projeto no Gantt e no Calendário.</span>
          </div>

          <div className="form-group">
            <label htmlFor="proj-desc">Descrição / Escopo</label>
            <textarea 
              id="proj-desc"
              rows={3}
              placeholder="Descreva o objetivo do projeto e contexto para a alocação..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="proj-status">Status</label>
            <select 
              id="proj-status"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="proj-portfolio">Portfólio de Projetos (US-015 / US-016)</label>
            <select 
              id="proj-portfolio"
              value={portfolioId}
              onChange={e => setPortfolioId(e.target.value)}
              disabled={Boolean(isGerenteRestrito)}
            >
              <option value="">Nenhum (Projeto sem portfólio atribuído)</option>
              {portfolios.map(pf => (
                <option key={pf.id} value={pf.id}>
                  📁 {pf.nome}
                </option>
              ))}
            </select>
            <span className="form-helper">
              {isGerenteRestrito
                ? 'Projeto vinculado automaticamente ao portfólio sob sua gestão.'
                : 'Vincule este projeto ao seu portfólio corporativo correspondente.'}
            </span>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Links Associados (SharePoint, Git, etc. - US-003)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={adicionarLink}
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
              >
                + Adicionar Link
              </button>
            </div>
            <span className="form-helper">
              Adicione links de pastas no SharePoint ou documentações que o gestor possa acessar diretamente.
            </span>

            <div className="dynamic-links-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {links.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Rótulo (ex: SharePoint)"
                    value={link.rotulo}
                    onChange={e => atualizarLink(idx, 'rotulo', e.target.value)}
                    style={{ flex: '1' }}
                  />
                  <input 
                    type="url" 
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={e => atualizarLink(idx, 'url', e.target.value)}
                    style={{ flex: '2' }}
                  />
                  {links.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm"
                      onClick={() => removerLink(idx)}
                      title="Remover link"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
