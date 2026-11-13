import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function UsuarioModal({
  isOpen,
  onClose,
  usuario = null,
  portfolios = [],
  usuarioLogado = null,
  onSalvarUsuario
}) {
  const isEditing = Boolean(usuario?.id);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [perfil, setPerfil] = useState('gerente');
  const [portfolioId, setPortfolioId] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        setNome(usuario.nome || '');
        setEmail(usuario.email || '');
        setSenha('');
        setConfirmarSenha('');
        setPerfil(usuario.perfil || 'gerente');
        setPortfolioId(usuario.portfolio_id ? String(usuario.portfolio_id) : '');
        setAtivo(usuario.ativo !== undefined ? Boolean(usuario.ativo) : true);
      } else {
        setNome('');
        setEmail('');
        setSenha('');
        setConfirmarSenha('');
        setPerfil('gerente');
        setPortfolioId(portfolios[0]?.id ? String(portfolios[0].id) : '');
        setAtivo(true);
      }
      setErro('');
    }
  }, [isOpen, usuario, portfolios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('O nome completo do usuário é obrigatório.');
      return;
    }
    if (!email.trim()) {
      setErro('O e-mail corporativo é obrigatório.');
      return;
    }

    // Validação de senha
    if (!isEditing) {
      if (!senha || senha.trim().length < 4) {
        setErro('A senha deve conter no mínimo 4 caracteres.');
        return;
      }
      if (senha !== confirmarSenha) {
        setErro('A confirmação da senha não coincide com a senha digitada.');
        return;
      }
    } else if (senha.trim().length > 0) {
      if (senha.trim().length < 4) {
        setErro('A nova senha deve conter no mínimo 4 caracteres.');
        return;
      }
      if (senha !== confirmarSenha) {
        setErro('A confirmação da senha não coincide com a nova senha digitada.');
        return;
      }
    }

    if (perfil === 'gerente' && !portfolioId) {
      setErro('Selecione o Portfólio de Projetos associado a este Gerente de Produto.');
      return;
    }

    try {
      setLoading(true);
      await onSalvarUsuario({
        id: usuario?.id,
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim() ? senha.trim() : undefined,
        perfil,
        portfolio_id: perfil === 'gerente' && portfolioId ? Number(portfolioId) : null,
        ativo: ativo ? 1 : 0
      });
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Usuário: ${usuario?.nome}` : '➕ Novo Usuário do Sistema'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            id="btn-confirmar-salvar-usuario"
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {erro && <div className="form-error-alert" style={{ marginBottom: '14px' }}>{erro}</div>}

        <div className="form-group">
          <label htmlFor="modal-user-nome">
            Nome Completo <span className="required">*</span>
          </label>
          <input
            id="modal-user-nome"
            type="text"
            placeholder="Ex: Carlos Alberto Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
            required
          />
          <span className="form-helper">Nome de identificação do colaborador no sistema.</span>
        </div>

        <div className="form-group">
          <label htmlFor="modal-user-email">
            E-mail Corporativo <span className="required">*</span>
          </label>
          <input
            id="modal-user-email"
            type="email"
            placeholder="nome.sobrenome@benner.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <span className="form-helper">Utilizado como login de acesso. Não pode haver e-mails duplicados.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="modal-user-perfil">
              Perfil de Acesso <span className="required">*</span>
            </label>
            <select
              id="modal-user-perfil"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
            >
              <option value="admin">👑 Administrador (PM / PO / Gestor)</option>
              <option value="desenvolvedor">👨‍💻 Desenvolvedor (Consumo / Somente Leitura)</option>
              <option value="gerente">📁 Gerente de Produto (PM por Portfólio)</option>
            </select>
            <span className="form-helper">
              {perfil === 'admin' && 'Acesso irrestrito a todos os portfólios, projetos, alocações e configurações.'}
              {perfil === 'desenvolvedor' && 'Acesso limitado exclusivamente para consulta e consumo. Sem permissão de alteração ou acesso administrativo.'}
              {perfil === 'gerente' && 'Acesso de gestão delimitado exclusivamente ao portfólio sob sua responsabilidade.'}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="modal-user-portfolio">
              Portfólio Vinculado {perfil === 'gerente' && <span className="required">*</span>}
            </label>
            <select
              id="modal-user-portfolio"
              value={perfil === 'gerente' ? portfolioId : ''}
              onChange={(e) => setPortfolioId(e.target.value)}
              disabled={perfil !== 'gerente'}
            >
              {perfil === 'admin' ? (
                <option value="">🌐 Todos os Portfólios (Visão Global)</option>
              ) : perfil === 'desenvolvedor' ? (
                <option value="">👁️ Visualização de Todos os Projetos (Leitura)</option>
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
            <span className="form-helper">
              {perfil === 'admin' && 'Administradores operam em nível global em todos os portfólios.'}
              {perfil === 'desenvolvedor' && 'Desenvolvedores podem consultar e acompanhar cronogramas e entregas.'}
              {perfil === 'gerente' && 'O gerente visualizará apenas dados deste portfólio ao logar.'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="modal-user-senha">
              {isEditing ? 'Nova Senha (opcional)' : 'Senha de Acesso *'}
            </label>
            <input
              id="modal-user-senha"
              type="password"
              placeholder={isEditing ? '•••••••• (manter atual)' : 'Mínimo 4 caracteres'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required={!isEditing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-user-confirmar-senha">
              Confirmar Senha {(!isEditing || senha) && <span className="required">*</span>}
            </label>
            <input
              id="modal-user-confirmar-senha"
              type="password"
              placeholder="Digite a senha novamente"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required={!isEditing || Boolean(senha)}
            />
          </div>
        </div>

        <div className="form-group" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.88rem' }}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: 600 }}>Usuário Ativo (permitir login no sistema)</span>
          </label>
          <span className="form-helper" style={{ display: 'block', marginTop: '4px' }}>
            Desmarque caso o colaborador seja desligado ou precise ter o acesso suspenso temporariamente.
          </span>
        </div>
      </form>
    </Modal>
  );
}

