import React, { useState } from 'react';

const CONTAS_DEMO = [
  {
    rotulo: '👑 Frederico Maiello (Product Owner)',
    subtitulo: 'Acesso total de Administrador / PO Benner',
    email: 'frederico.maielo@benner.com.br',
    senha: 'benner',
    cor: '#2563EB'
  },
  {
    rotulo: '👑 Erick Souza (Admin Geral)',
    subtitulo: 'Acesso total a todos os portfólios e gestão de usuários',
    email: 'erick.souza@benner.com.br',
    senha: 'admin123',
    cor: '#1D4ED8'
  },
  {
    rotulo: '👨‍💻 Dev Team (Somente Leitura)',
    subtitulo: 'Visualização de alocações e consumo sem edição',
    email: 'dev@benner.com.br',
    senha: 'dev123',
    cor: '#7C3AED'
  },
  {
    rotulo: '📁 Carlos Silva (Gerente Financeiro)',
    subtitulo: 'Portfólio: Benner Gestão Financeira',
    email: 'carlos.silva@benner.com.br',
    senha: '123456',
    cor: '#0891B2'
  }
];

export default function LoginView({ onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const autenticar = async (emailAlvo, senhaAlvo) => {
    try {
      setLoading(true);
      setErro('');
      await onLogin(emailAlvo, senhaAlvo);
    } catch (err) {
      setErro(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail corporativo e senha.');
      return;
    }
    await autenticar(email.trim(), senha);
  };

  const handleDemoAccess = async (conta) => {
    setEmail(conta.email);
    setSenha(conta.senha);
    await autenticar(conta.email, conta.senha);
  };

  return (
    <div
      className="login-page-wrapper"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        position: 'relative'
      }}
    >
      {/* Alternador de Tema no Canto Superior Direito */}
      <div style={{ position: 'absolute', top: '20px', right: '24px' }}>
        <button
          id="btn-login-toggle-theme"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>

      <div
        className="login-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg, 14px)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Cabeçalho de Identidade Visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div
            className="brand-logo"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M8 14h4M8 18h8" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Mapa de Alocação
            </h1>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Acesso Corporativo por Portfólio (US-016)
            </span>
          </div>
        </div>

        {erro && (
          <div className="form-error-alert" style={{ marginBottom: '16px' }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">E-mail Corporativo</label>
            <input
              id="login-email"
              type="email"
              placeholder="nome.sobrenome@benner.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="login-senha">Senha</label>
            <input
              id="login-senha"
              type="password"
              placeholder="Digite sua senha..."
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            id="btn-entrar-login"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 16px', fontSize: '0.95rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Autenticando...' : '🔐 Entrar no Mapa de Alocação'}
          </button>
        </form>

        {/* Seção de Acesso Rápido (Perfis Pré-Configurados) */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ Acesso Rápido para Testes (1 Clique):
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CONTAS_DEMO.map((conta) => (
              <button
                key={conta.email}
                type="button"
                className="demo-account-btn"
                onClick={() => handleDemoAccess(conta)}
                disabled={loading}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderLeft: `4px solid ${conta.cor}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{conta.rotulo}</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>Entrar →</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {conta.subtitulo} ({conta.email})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

