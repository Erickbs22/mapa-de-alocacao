import React, { useState } from 'react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onExportBackup, 
  onOpenImportBackup,
  onOpenAusencias,
  portfolios = [],
  portfolioAtivoId,
  onSelecionarPortfolio,
  onOpenPortfolios,
  usuarioLogado,
  onNovoUsuario,
  onLogout,
  theme,
  onToggleTheme,
  contarFinaisDeSemana = false,
  onToggleFinaisDeSemana
}) {
  const [menuDadosAberto, setMenuDadosAberto] = useState(false);
  const isDesenvolvedor = usuarioLogado?.perfil === 'desenvolvedor';
  const isAdmin = !usuarioLogado || usuarioLogado.perfil === 'admin';
  const portfolioGerente = portfolios.find(p => String(p.id) === String(usuarioLogado?.portfolio_id));

  const tabs = [
    { id: 'gantt', label: 'Gantt', fullTitle: 'Linha do Tempo (Gantt) — Visão Matricial', icon: '📊' },
    { id: 'calendario', label: 'Calendário', fullTitle: 'Visão Mensal em Calendário', icon: '📅' },
    { id: 'dashboard', label: 'Dashboard', fullTitle: 'Dashboard & Métricas Executivas', icon: '📈' },
    { id: 'programadores', label: 'Programadores', fullTitle: 'Gestão de Recursos & Desenvolvedores', icon: '👨‍💻' },
    { id: 'projetos', label: 'Projetos', fullTitle: 'Gestão de Projetos & Backlog', icon: '📁' },
    ...(isAdmin ? [{ id: 'usuarios', label: 'Usuários', fullTitle: 'Gestão de Acessos & Usuários', icon: '👥' }] : [])
  ];

  return (
    <header className="app-header">
      {/* Brand / Logo */}
      <div className="header-brand">
        <div className="brand-logo" title="Mapa de Alocação de Programadores">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h4M8 18h8" />
          </svg>
        </div>
        <div className="brand-info">
          <h1>Mapa de Alocação</h1>
          <span className="brand-subtitle">Planejamento Visual</span>
        </div>
      </div>

      {/* Navegação Principal por Abas */}
      <nav className="header-nav" aria-label="Navegação principal">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            type="button"
            className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.fullTitle || tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Ações e Controles Globais do Header */}
      <div className="header-actions">
        {/* Seletor de Portfólio Global (US-015 / US-016) */}
        <div className="portfolio-selector-box">
          {isAdmin ? (
            <select
              id="nav-select-portfolio"
              value={portfolioAtivoId || ''}
              onChange={e => onSelecionarPortfolio(e.target.value)}
              className="nav-portfolio-select"
              title="Filtrar visão pelo Portfólio de Projetos selecionado (US-015)"
            >
              <option value="">🌐 Todos os Portfólios</option>
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>
                  📁 {p.nome}
                </option>
              ))}
            </select>
          ) : (
            <span
              id="badge-portfolio-gerente"
              className="badge-portfolio-gerente"
              title={`Visão restrita ao portfólio sob sua gestão (${portfolioGerente?.nome || usuarioLogado?.portfolio_nome || 'Portfólio'})`}
              style={{
                borderColor: portfolioGerente?.cor || usuarioLogado?.portfolio_cor || 'var(--primary)',
                borderLeftColor: portfolioGerente?.cor || usuarioLogado?.portfolio_cor || 'var(--primary)'
              }}
            >
              <span>🔒 📁</span>
              <span>{portfolioGerente?.nome || usuarioLogado?.portfolio_nome || 'Meu Portfólio'}</span>
            </span>
          )}
        </div>

        {/* Parâmetro de Sistema: Contar ou Ignorar Finais de Semana */}
        <button
          id="btn-toggle-param-fds"
          type="button"
          className={`nav-pill-btn ${contarFinaisDeSemana ? 'is-active-warning' : 'is-default'}`}
          onClick={onToggleFinaisDeSemana}
          title={
            contarFinaisDeSemana
              ? 'Parâmetro de Sistema: Finais de semana ESTÃO sendo computados nas alocações. Clique para ignorar sábados e domingos.'
              : 'Parâmetro de Sistema: Finais de semana NÃO estão sendo computados (apenas dias úteis Seg-Sex). Clique para passar a contar sábados e domingos.'
          }
        >
          <span>{contarFinaisDeSemana ? '🗓️ FDS: Contar' : '🚫 FDS: Ignorar'}</span>
        </button>

        {/* Gestão de Ausências (se não for dev somente-leitura) */}
        {!isDesenvolvedor && (
          <button 
            id="btn-gestao-ausencias" 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenAusencias}
            title="Cadastrar e gerenciar férias, folgas e feriados corporativos (US-021)"
          >
            <span>🏖️</span> Ausências
          </button>
        )}

        {/* Menu Dropdown de Dados & Backup */}
        <div className="nav-dropdown-wrapper">
          <button
            id="btn-nav-dados-menu"
            type="button"
            className={`btn btn-secondary btn-sm ${menuDadosAberto ? 'active' : ''}`}
            onClick={() => setMenuDadosAberto(prev => !prev)}
            title="Operações de Dados, Backups e Portfólios"
          >
            <span>💾</span> Dados ▾
          </button>

          {menuDadosAberto && (
            <>
              <div 
                className="dropdown-backdrop" 
                onClick={() => setMenuDadosAberto(false)} 
              />
              <div className="nav-dropdown-popover">
                <button 
                  id="btn-export-backup" 
                  type="button"
                  className="nav-dropdown-item"
                  onClick={() => {
                    setMenuDadosAberto(false);
                    onExportBackup();
                  }}
                  title="Exportar backup completo em JSON"
                >
                  <span>💾</span> Exportar Backup JSON
                </button>

                {!isDesenvolvedor && (
                  <button 
                    id="btn-import-backup" 
                    type="button"
                    className="nav-dropdown-item"
                    onClick={() => {
                      setMenuDadosAberto(false);
                      onOpenImportBackup();
                    }}
                    title="Restaurar backup a partir de arquivo JSON"
                  >
                    <span>📥</span> Importar Backup...
                  </button>
                )}

                {isAdmin && (
                  <button
                    id="btn-gestao-portfolios"
                    type="button"
                    className="nav-dropdown-item"
                    onClick={() => {
                      setMenuDadosAberto(false);
                      onOpenPortfolios();
                    }}
                    title="Gerenciar Portfólios de Projetos (US-015)"
                  >
                    <span>📁</span> Gerenciar Portfólios...
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cadastro Rápido de Novo Usuário (Admin) */}
        {isAdmin && (
          <button
            id="btn-nav-novo-usuario"
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNovoUsuario}
            title="Cadastrar Novo Usuário ou Gerente de Produto no Sistema (US-016)"
          >
            <span>👤+</span> Novo Usuário
          </button>
        )}

        {/* Alternador de Tema Claro / Escuro (Ícone compacto) */}
        <button
          id="btn-toggle-theme"
          type="button"
          className="btn-theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          aria-label={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Identificação do Usuário Logado e Logout (US-016) */}
        {usuarioLogado && (
          <div className="user-nav-chip">
            <span className="user-nav-avatar">
              {usuarioLogado.perfil === 'admin' ? '👑' : usuarioLogado.perfil === 'desenvolvedor' ? '👨‍💻' : '👤'}
            </span>
            <span 
              className="user-nav-name"
              title={`${usuarioLogado.nome} (${usuarioLogado.email}) — Perfil: ${usuarioLogado.perfil === 'admin' ? 'Administrador' : usuarioLogado.perfil === 'desenvolvedor' ? 'Desenvolvedor (Leitura)' : 'Gerente de Produto'}`}
            >
              {usuarioLogado.nome.split(' ')[0]}
            </span>
            <button
              id="btn-logout"
              type="button"
              className="btn-logout-chip"
              onClick={onLogout}
              title="Encerrar sessão"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
