import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ProgramadoresView from './components/ProgramadoresView';
import ProjetosView from './components/ProjetosView';
import GanttView from './components/GanttView';
import CalendarioView from './components/CalendarioView';
import DashboardView from './components/DashboardView';
import AlocacaoModal from './components/AlocacaoModal';
import ImportBackupModal from './components/ImportBackupModal';
import AusenciaModal from './components/AusenciaModal';
import PortfolioModal from './components/PortfolioModal';
import LoginView from './components/LoginView';
import UsuariosView from './components/UsuariosView';
import UsuarioModal from './components/UsuarioModal';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('gantt');
  const [programadores, setProgramadores] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const savedUser = localStorage.getItem('app_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [portfolioAtivoId, setPortfolioAtivoId] = useState(() => {
    try {
      const savedUser = localStorage.getItem('app_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.perfil === 'gerente' && parsed.portfolio_id) {
          return String(parsed.portfolio_id);
        }
      }
      return localStorage.getItem('app_portfolio_ativo_id') || '';
    } catch {
      return '';
    }
  });
  const [alocacoes, setAlocacoes] = useState([]);
  const [ausencias, setAusencias] = useState([]);
  const [paletaInfo, setPaletaInfo] = useState({ paleta: [], coresEmUso: [], proximaSugerida: '#2563EB' });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const exibirFeedback = useCallback((msg, tipo = 'success') => {
    setFeedback({ msg, tipo });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  // Tema: Claro ou Escuro (Dark Mode padrão, com alternador e persistência)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('app-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('app-theme', theme);
    } catch (e) {
      console.error('Falha ao persistir tema:', e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Estados do Modal de Alocação (Fase 2)
  const [modalAlocacaoAberto, setModalAlocacaoAberto] = useState(false);
  const [alocacaoEmEdicao, setAlocacaoEmEdicao] = useState(null);
  const [dadosIniciaisAlocacao, setDadosIniciaisAlocacao] = useState(null);

  // Estados do Modal de Importação de Backup (Fase 3)
  const [modalImportBackupAberto, setModalImportBackupAberto] = useState(false);

  // Estados do Modal de Ausências (Fase 5 - US-021)
  const [modalAusenciaAberto, setModalAusenciaAberto] = useState(false);
  const [devParaAusencia, setDevParaAusencia] = useState(null);

  // Estados do Modal de Portfólios (US-015)
  const [modalPortfolioAberto, setModalPortfolioAberto] = useState(false);

  // Estados do Modal de Usuários (US-016)
  const [modalUsuariosAberto, setModalUsuariosAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);

  // Parâmetro Global de Finais de Semana: contar ou não contar finais de semana como dias de alocação
  const [contarFinaisDeSemana, setContarFinaisDeSemana] = useState(() => {
    try {
      const saved = localStorage.getItem('app_contar_finais_de_semana');
      return saved === 'true'; // Padrão: false (Finais de semana NÃO contam)
    } catch {
      return false;
    }
  });

  const toggleFinaisDeSemana = useCallback(() => {
    setContarFinaisDeSemana(prev => {
      const novoValor = !prev;
      try {
        localStorage.setItem('app_contar_finais_de_semana', String(novoValor));
      } catch (e) {
        console.error('Erro ao salvar preferência de finais de semana:', e);
      }
      exibirFeedback(
        novoValor
          ? '🗓️ Parâmetro ativado: Finais de semana passam a contar como dias de alocação.'
          : '🚫 Parâmetro desativado: Finais de semana NÃO são mais computados como alocação (apenas dias úteis Seg-Sex).'
      );
      return novoValor;
    });
  }, [exibirFeedback]);

  const handleAbrirNovoUsuario = useCallback(() => {
    setUsuarioEmEdicao(null);
    setModalUsuariosAberto(true);
  }, []);

  const handleAbrirEditarUsuario = useCallback((usuario) => {
    setUsuarioEmEdicao(usuario);
    setModalUsuariosAberto(true);
  }, []);

  // Carregar dados iniciais do backend
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [resProg, resProj, resAloc, resCores, resAus, resPort, resUsers] = await Promise.all([
        fetch('/api/programadores'),
        fetch('/api/projetos'),
        fetch('/api/alocacoes'),
        fetch('/api/cores-disponiveis'),
        fetch('/api/ausencias'),
        fetch('/api/portfolios'),
        fetch('/api/usuarios')
      ]);

      if (resProg.ok) setProgramadores(await resProg.json());
      if (resProj.ok) setProjetos(await resProj.json());
      if (resAloc.ok) setAlocacoes(await resAloc.json());
      if (resCores.ok) setPaletaInfo(await resCores.json());
      if (resAus.ok) setAusencias(await resAus.json());
      if (resPort.ok) setPortfolios(await resPort.json());
      if (resUsers.ok) setUsuarios(await resUsers.json());
    } catch (err) {
      console.error('Erro ao conectar ao backend:', err);
      exibirFeedback('Erro ao conectar ao servidor backend.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [exibirFeedback]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Validação da sessão existente no carregamento (US-016)
  useEffect(() => {
    const token = localStorage.getItem('app_auth_token');
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem('app_auth_token');
          localStorage.removeItem('app_auth_user');
          setUsuarioLogado(null);
          return;
        }
        const data = await res.json();
        if (data?.usuario) {
          setUsuarioLogado(data.usuario);
          localStorage.setItem('app_auth_user', JSON.stringify(data.usuario));
          if (data.usuario.perfil === 'gerente' && data.usuario.portfolio_id) {
            setPortfolioAtivoId(String(data.usuario.portfolio_id));
          }
        }
      })
      .catch(() => {});
  }, []);

  // ==========================================
  // OPERAÇÕES DE AUTENTICAÇÃO E USUÁRIOS (US-016)
  // ==========================================
  const handleLogin = async (email, senha) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao realizar login.');
    }

    localStorage.setItem('app_auth_token', data.token);
    localStorage.setItem('app_auth_user', JSON.stringify(data.usuario));
    setUsuarioLogado(data.usuario);

    if (data.usuario.perfil === 'gerente' && data.usuario.portfolio_id) {
      const portId = String(data.usuario.portfolio_id);
      setPortfolioAtivoId(portId);
      localStorage.setItem('app_portfolio_ativo_id', portId);
      exibirFeedback(`Bem-vindo(a), ${data.usuario.nome}! Portfólio ativo: ${data.usuario.portfolio_nome || 'Seu Portfólio'}`);
    } else {
      setPortfolioAtivoId('');
      localStorage.removeItem('app_portfolio_ativo_id');
      exibirFeedback(`Bem-vindo(a), ${data.usuario.nome} (Acesso Administrador)!`);
    }

    await carregarDados();
  };

  const handleLogout = () => {
    localStorage.removeItem('app_auth_token');
    localStorage.removeItem('app_auth_user');
    setUsuarioLogado(null);
    setModalUsuariosAberto(false);
    setModalPortfolioAberto(false);
  };

  const handleSalvarUsuario = async (userData) => {
    const isEdit = !!userData.id;
    const url = isEdit ? `/api/usuarios/${userData.id}` : '/api/usuarios';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar usuário.');

    await carregarDados();
    if (usuarioLogado && data.id === usuarioLogado.id) {
      setUsuarioLogado(data);
      localStorage.setItem('app_auth_user', JSON.stringify(data));
    }
    exibirFeedback(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
  };

  const handleExcluirUsuario = async (id) => {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir usuário.');
    await carregarDados();
    exibirFeedback('Usuário removido com sucesso.');
  };

  // ==========================================
  // OPERAÇÕES DE AUSÊNCIAS (US-021)
  // ==========================================
  const handleSalvarAusencia = async (dados) => {
    const res = await fetch('/api/ausencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar ausência.');
    await carregarDados();
    exibirFeedback('Ausência registrada com sucesso!');
    return data;
  };

  const handleExcluirAusencia = async (id) => {
    const res = await fetch(`/api/ausencias/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir ausência.');
    await carregarDados();
    exibirFeedback('Ausência excluída com sucesso.');
  };

  const handleAbrirAusencia = (dev = null) => {
    setDevParaAusencia(dev);
    setModalAusenciaAberto(true);
  };

  // ==========================================
  // OPERAÇÕES DE PORTFÓLIOS (US-015)
  // ==========================================
  const handleSelecionarPortfolio = (id) => {
    setPortfolioAtivoId(id);
    try {
      if (id) localStorage.setItem('app_portfolio_ativo_id', id);
      else localStorage.removeItem('app_portfolio_ativo_id');
    } catch (e) {
      console.error('Falha ao salvar portfólio no localStorage:', e);
    }
    const nomePort = portfolios.find(p => String(p.id) === String(id))?.nome;
    exibirFeedback(id ? `Filtrando pelo portfólio: ${nomePort}` : 'Exibindo todos os portfólios.');
  };

  const handleSalvarPortfolio = async (portData) => {
    const isEdit = !!portData.id;
    const url = isEdit ? `/api/portfolios/${portData.id}` : '/api/portfolios';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar portfólio.');

    await carregarDados();
    exibirFeedback(isEdit ? 'Portfólio atualizado com sucesso!' : 'Portfólio cadastrado com sucesso!');
  };

  const handleExcluirPortfolio = async (id) => {
    const res = await fetch(`/api/portfolios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir portfólio.');

    if (String(portfolioAtivoId) === String(id)) {
      handleSelecionarPortfolio('');
    }
    await carregarDados();
    exibirFeedback('Portfólio excluído com sucesso.');
  };

  // Filtragem de Projetos pelo Portfólio Ativo (US-015)
  const projetosFiltradosPorPortfolio = React.useMemo(() => {
    if (!portfolioAtivoId) return projetos;
    return projetos.filter(p => String(p.portfolio_id) === String(portfolioAtivoId));
  }, [projetos, portfolioAtivoId]);

  // ==========================================
  // OPERAÇÕES DE PROGRAMADORES (US-001, US-004)
  // ==========================================
  const handleSalvarProgramador = async (progData) => {
    const isEdit = !!progData.id;
    const url = isEdit ? `/api/programadores/${progData.id}` : '/api/programadores';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao salvar programador.');
    }

    exibirFeedback(isEdit ? 'Programador atualizado com sucesso!' : 'Programador cadastrado com sucesso!');
    carregarDados();
  };

  const handleExcluirProgramador = async (id) => {
    try {
      const res = await fetch(`/api/programadores/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir programador.');
      }
      exibirFeedback('Programador excluído com sucesso.');
      carregarDados();
    } catch (err) {
      exibirFeedback(err.message, 'danger');
    }
  };

  // ==========================================
  // OPERAÇÕES DE PROJETOS (US-002, US-003)
  // ==========================================
  const handleSalvarProjeto = async (projData) => {
    const isEdit = !!projData.id;
    const url = isEdit ? `/api/projetos/${projData.id}` : '/api/projetos';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao salvar projeto.');
    }

    exibirFeedback(isEdit ? 'Projeto atualizado com sucesso!' : 'Projeto cadastrado com sucesso!');
    carregarDados();
  };

  const handleExcluirProjeto = async (id) => {
    try {
      const res = await fetch(`/api/projetos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir projeto.');
      }
      exibirFeedback('Projeto excluído com sucesso.');
      carregarDados();
    } catch (err) {
      exibirFeedback(err.message, 'danger');
    }
  };

  // ==========================================
  // OPERAÇÕES DE ALOCAÇÕES (FASE 2: US-005, US-007, US-008, US-009)
  // ==========================================
  const handleAbrirCriarAlocacao = (dadosIniciais = null) => {
    setAlocacaoEmEdicao(null);
    setDadosIniciaisAlocacao(dadosIniciais);
    setModalAlocacaoAberto(true);
  };

  const handleAbrirEditarAlocacao = (aloc) => {
    setAlocacaoEmEdicao(aloc);
    setDadosIniciaisAlocacao(null);
    setModalAlocacaoAberto(true);
  };

  const handleSalvarAlocacao = async (alocData) => {
    const isEdit = !!alocData.id;
    const url = isEdit ? `/api/alocacoes/${alocData.id}` : '/api/alocacoes';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alocData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao salvar alocação.');
    }

    exibirFeedback(isEdit ? 'Alocação atualizada com sucesso!' : 'Alocação criada com sucesso!');
    carregarDados();
  };

  const handleExcluirAlocacao = async (id) => {
    try {
      const res = await fetch(`/api/alocacoes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir alocação.');
      }
      exibirFeedback('Alocação excluída com sucesso.');
      carregarDados();
    } catch (err) {
      exibirFeedback(err.message, 'danger');
    }
  };

  const handleMoverAlocacao = async (aloc, novosDados) => {
    try {
      const payload = {
        dia_todo: aloc.dia_todo,
        horas: aloc.horas,
        observacao: aloc.observacao,
        ...novosDados
      };

      const res = await fetch(`/api/alocacoes/${aloc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao mover alocação.');
      }

      const nomeDev = aloc.programador_nome || 'Programador';
      const dataFormatada = novosDados.data ? novosDados.data.split('-').reverse().join('/') : 'novo local';
      exibirFeedback(`Alocação de ${nomeDev} movida para ${dataFormatada}!`);
      carregarDados();
    } catch (err) {
      console.error('Erro ao mover alocação:', err);
      exibirFeedback(err.message, 'danger');
    }
  };

  const handleSalvarPeriodo = async (dadosPeriodo) => {
    const res = await fetch('/api/alocacoes/periodo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosPeriodo)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao registrar alocações no período.');
    }

    exibirFeedback(data.message || `Sucesso: ${data.totalCriadas || 0} dia(s) alocado(s) no projeto!`);
    await carregarDados();
  };

  const handleSalvarLote = async (alocacoesLote) => {
    try {
      const res = await fetch('/api/alocacoes/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alocacoes: alocacoesLote })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao replicar alocações em lote.');
      }

      exibirFeedback(data.message || `${alocacoesLote.length} dia(s) preenchido(s) com sucesso!`);
      await carregarDados();
    } catch (err) {
      console.error('Erro ao preencher em lote:', err);
      exibirFeedback(err.message, 'danger');
    }
  };

  // ==========================================
  // BACKUP: EXPORTAR E IMPORTAR (FASE 3)
  // ==========================================
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) throw new Error('Falha ao exportar backup');
      const backupData = await res.json();
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_mapa_alocacao_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      exibirFeedback('Backup JSON exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      exibirFeedback('Erro ao exportar backup.', 'danger');
    }
  };

  const handleImportarBackup = async (backupJson) => {
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupJson)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao importar backup.');
    }

    exibirFeedback('Backup restaurado e sincronizado com sucesso!');
    await carregarDados();
  };

  // Se não houver usuário autenticado, exibe a tela de Login Corporativo (US-016)
  if (!usuarioLogado) {
    return (
      <LoginView
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="app-layout">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onExportBackup={handleExportBackup} 
        onOpenImportBackup={() => setModalImportBackupAberto(true)}
        onOpenAusencias={() => handleAbrirAusencia(null)}
        portfolios={portfolios}
        portfolioAtivoId={portfolioAtivoId}
        onSelecionarPortfolio={handleSelecionarPortfolio}
        onOpenPortfolios={() => setModalPortfolioAberto(true)}
        usuarioLogado={usuarioLogado}
        onNovoUsuario={handleAbrirNovoUsuario}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        contarFinaisDeSemana={contarFinaisDeSemana}
        onToggleFinaisDeSemana={toggleFinaisDeSemana}
      />

      {feedback && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: feedback.tipo === 'danger' ? 'var(--danger)' : 'var(--success)',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          fontWeight: 600,
          animation: 'scaleUp 0.2s ease-out'
        }}>
          {feedback.msg}
        </div>
      )}

      <main className="app-main">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>Carregando dados do sistema...</p>
          </div>
        ) : (
          <>
            {activeTab === 'gantt' && (
              <GanttView 
                projetos={projetosFiltradosPorPortfolio}
                programadores={programadores}
                alocacoes={alocacoes}
                ausencias={ausencias}
                usuarioLogado={usuarioLogado}
                contarFinaisDeSemana={contarFinaisDeSemana}
                onCriarAlocacao={handleAbrirCriarAlocacao}
                onEditarAlocacao={handleAbrirEditarAlocacao}
                onMoverAlocacao={handleMoverAlocacao}
                onSalvarLote={handleSalvarLote}
                onAbrirAusencia={handleAbrirAusencia}
              />
            )}

            {activeTab === 'calendario' && (
              <CalendarioView 
                alocacoes={alocacoes}
                programadores={programadores}
                projetos={projetosFiltradosPorPortfolio}
                ausencias={ausencias}
                usuarioLogado={usuarioLogado}
                contarFinaisDeSemana={contarFinaisDeSemana}
                onCriarAlocacao={handleAbrirCriarAlocacao}
                onEditarAlocacao={handleAbrirEditarAlocacao}
                onMoverAlocacao={handleMoverAlocacao}
                onAbrirAusencia={handleAbrirAusencia}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView 
                alocacoes={alocacoes}
                programadores={programadores}
                projetos={projetosFiltradosPorPortfolio}
                ausencias={ausencias}
                contarFinaisDeSemana={contarFinaisDeSemana}
              />
            )}

            {activeTab === 'programadores' && (
              <ProgramadoresView 
                programadores={programadores}
                projetos={projetosFiltradosPorPortfolio}
                alocacoes={alocacoes}
                ausencias={ausencias}
                paletaInfo={paletaInfo}
                usuarioLogado={usuarioLogado}
                onSalvarProgramador={handleSalvarProgramador}
                onExcluirProgramador={handleExcluirProgramador}
                onSalvarPeriodo={handleSalvarPeriodo}
                onExcluirAlocacao={handleExcluirAlocacao}
                onAbrirAusencia={handleAbrirAusencia}
              />
            )}

            {activeTab === 'projetos' && (
              <ProjetosView 
                projetos={projetosFiltradosPorPortfolio}
                portfolios={portfolios}
                portfolioAtivoId={portfolioAtivoId}
                usuarioLogado={usuarioLogado}
                onSalvarProjeto={handleSalvarProjeto}
                onExcluirProjeto={handleExcluirProjeto}
              />
            )}

            {activeTab === 'usuarios' && (
              <UsuariosView 
                usuarios={usuarios}
                portfolios={portfolios}
                usuarioLogado={usuarioLogado}
                onNovoUsuario={handleAbrirNovoUsuario}
                onEditarUsuario={handleAbrirEditarUsuario}
                onExcluirUsuario={handleExcluirUsuario}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de Criação / Edição de Alocação (Fase 2) */}
      <AlocacaoModal
        isOpen={modalAlocacaoAberto}
        onClose={() => setModalAlocacaoAberto(false)}
        alocacao={alocacaoEmEdicao}
        dadosIniciais={dadosIniciaisAlocacao}
        programadores={programadores}
        projetos={projetosFiltradosPorPortfolio}
        alocacoesExistentes={alocacoes}
        ausencias={ausencias}
        isReadOnly={usuarioLogado?.perfil === 'desenvolvedor'}
        contarFinaisDeSemana={contarFinaisDeSemana}
        onSalvar={handleSalvarAlocacao}
        onExcluir={handleExcluirAlocacao}
      />

      {/* Modal de Gestão de Férias e Ausências (Fase 5 - US-021) */}
      <AusenciaModal
        isOpen={modalAusenciaAberto}
        onClose={() => setModalAusenciaAberto(false)}
        programadores={programadores}
        ausencias={ausencias}
        programadorPreSelecionado={devParaAusencia}
        onSalvarAusencia={handleSalvarAusencia}
        onExcluirAusencia={handleExcluirAusencia}
      />

      {/* Modal de Importação de Backup (Fase 3) */}
      <ImportBackupModal
        isOpen={modalImportBackupAberto}
        onClose={() => setModalImportBackupAberto(false)}
        onImportarBackup={handleImportarBackup}
      />

      {/* Modal de Gestão de Portfólios (US-015) */}
      <PortfolioModal
        isOpen={modalPortfolioAberto}
        onClose={() => setModalPortfolioAberto(false)}
        portfolios={portfolios}
        onSalvarPortfolio={handleSalvarPortfolio}
        onExcluirPortfolio={handleExcluirPortfolio}
      />

      {/* Modal de Criação / Edição de Usuário e Gerentes de Produto (US-016) */}
      <UsuarioModal
        isOpen={modalUsuariosAberto}
        onClose={() => {
          setModalUsuariosAberto(false);
          setUsuarioEmEdicao(null);
        }}
        usuario={usuarioEmEdicao}
        portfolios={portfolios}
        usuarioLogado={usuarioLogado}
        onSalvarUsuario={handleSalvarUsuario}
      />
    </div>
  );
}
