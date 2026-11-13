import React, { useState } from 'react';
import Modal from './Modal';
import PlanejarAlocacoesModal from './PlanejarAlocacoesModal';

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

export default function ProgramadoresView({ 
  programadores, 
  projetos = [],
  alocacoes = [],
  paletaInfo, 
  ausencias = [],
  usuarioLogado = null,
  onSalvarProgramador, 
  onExcluirProgramador,
  onSalvarPeriodo,
  onExcluirAlocacao,
  onAbrirAusencia
}) {
  const isDesenvolvedor = usuarioLogado?.perfil === 'desenvolvedor';
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [programadorPlanejamento, setProgramadorPlanejamento] = useState(null);
  
  // Estado do formulário
  const [nome, setNome] = useState('');
  const [tecnologias, setTecnologias] = useState('');
  const [email, setEmail] = useState('');
  const [cor, setCor] = useState('');
  const [erro, setErro] = useState('');

  // Abrir modal para novo
  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setTecnologias('');
    setEmail('');
    setCor(paletaInfo?.proximaSugerida || '#2563EB');
    setErro('');
    setModalAberto(true);
  };

  // Abrir modal para edição
  const abrirEditar = (prog) => {
    setEditando(prog);
    setNome(prog.nome);
    setTecnologias(prog.tecnologias || '');
    setEmail(prog.email || '');
    setCor(prog.cor || '#2563EB');
    setErro('');
    setModalAberto(true);
  };

  // Submeter formulário (RN-02: nome obrigatório)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome do programador é obrigatório (RN-02).');
      return;
    }

    try {
      await onSalvarProgramador({
        id: editando ? editando.id : undefined,
        nome: nome.trim(),
        tecnologias: tecnologias.trim(),
        email: email.trim(),
        cor: cor || paletaInfo?.proximaSugerida || '#2563EB'
      });
      setModalAberto(false);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar programador.');
    }
  };

  // Filtragem
  const filtrados = programadores.filter(p => {
    const termo = busca.toLowerCase();
    return p.nome.toLowerCase().includes(termo) || 
           (p.tecnologias && p.tecnologias.toLowerCase().includes(termo)) ||
           (p.email && p.email.toLowerCase().includes(termo));
  });

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Programadores ({programadores.length})</h2>
          <p>Gerencie a equipe e suas cores exclusivas de identificação no mapa.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isDesenvolvedor && (
            <>
              <button 
                id="btn-gerenciar-todas-ausencias"
                type="button"
                className="btn btn-secondary"
                onClick={() => onAbrirAusencia && onAbrirAusencia(null)}
                title="Registrar férias, folgas ou feriados corporativos globais"
              >
                <span>🏖️</span> Férias & Feriados
              </button>
              <button id="btn-novo-programador" className="btn btn-primary" onClick={abrirNovo}>
                <span>+</span> Novo Programador
              </button>
            </>
          )}
        </div>
      </div>

      <div className="view-controls">
        <div className="search-box">
          <input 
            id="busca-programadores"
            type="text" 
            placeholder="Buscar por nome, tecnologias ou e-mail..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="cards-grid">
        {filtrados.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum programador encontrado.</p>
          </div>
        ) : (() => {
          const hojeIso = new Date().toISOString().split('T')[0];
          return filtrados.map(prog => {
            const contrast = getContrastColor(prog.cor);
            const iniciais = prog.nome
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const ausenciasDoDev = (ausencias || []).filter(a => a.programador_id === prog.id);
            const ausenciaAtiva = ausenciasDoDev.find(a => hojeIso >= a.data_inicio && hojeIso <= a.data_fim);

            return (
              <div key={prog.id} className="card programador-card">
                <div className="card-top">
                  <div 
                    className="avatar-circle" 
                    style={{ backgroundColor: prog.cor, color: contrast }}
                    title={`Cor de identificação: ${prog.cor}`}
                  >
                    {iniciais}
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">{prog.nome}</h3>
                    {prog.email && <span className="card-subtitle">{prog.email}</span>}
                  </div>
                </div>

                <div className="card-body">
                  <div className="cor-tag-container">
                    <span className="cor-swatch" style={{ backgroundColor: prog.cor }} />
                    <span className="cor-code">{prog.cor}</span>
                  </div>

                  {prog.tecnologias ? (
                    <div className="tags-container">
                      {prog.tecnologias.split(',').map((tech, idx) => (
                        <span key={idx} className="tech-badge">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted text-sm">Sem tecnologias registradas</span>
                  )}

                  {/* Indicador de Ausências / Férias */}
                  {ausenciasDoDev.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      {ausenciaAtiva ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          🏖️ Em Ausência ({ausenciaAtiva.tipo})
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                          📅 {ausenciasDoDev.length} ausência(s) registrada(s)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isDesenvolvedor && (
                  <div className="card-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button 
                      id={`btn-planejar-prog-${prog.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: '1 1 100%', marginBottom: '2px' }}
                      onClick={() => setProgramadorPlanejamento(prog)}
                      title="Definir alocações deste programador em projetos e múltiplos períodos"
                    >
                      📅 Planejar Alocações
                    </button>
                    <button
                      id={`btn-ausencias-prog-${prog.id}`}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: '1 1 100%' }}
                      onClick={() => onAbrirAusencia && onAbrirAusencia(prog)}
                      title="Cadastrar ou visualizar férias e ausências deste programador"
                    >
                      🏖️ Férias / Ausências {ausenciasDoDev.length > 0 ? `(${ausenciasDoDev.length})` : ''}
                    </button>
                    <button 
                      id={`btn-editar-prog-${prog.id}`}
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => abrirEditar(prog)}
                    >
                      Editar
                    </button>
                    <button 
                      id={`btn-excluir-prog-${prog.id}`}
                      className="btn btn-danger btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir o programador "${prog.nome}"? Suas alocações também serão removidas.`)) {
                          onExcluirProgramador(prog.id);
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Modal de Criação / Edição (US-001, US-004) */}
      <Modal 
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Programador' : 'Novo Programador'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button id="btn-salvar-programador" type="button" className="btn btn-primary" onClick={handleSubmit}>
              Salvar Programador
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {erro && <div className="form-error-alert">{erro}</div>}

          <div className="form-group">
            <label htmlFor="prog-nome">
              Nome do Programador <span className="required">*</span>
            </label>
            <input 
              id="prog-nome"
              type="text" 
              placeholder="Ex: Carlos Alberto Silva"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoFocus
              required
            />
            <span className="form-helper">Campo obrigatório conforme regra de negócio RN-02.</span>
          </div>

          <div className="form-group">
            <label htmlFor="prog-tech">Tecnologias e Habilidades (opcional)</label>
            <input 
              id="prog-tech"
              type="text" 
              placeholder="Ex: React, Node.js, SQL, TypeScript (separados por vírgula)"
              value={tecnologias}
              onChange={e => setTecnologias(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prog-email">E-mail de Contato (opcional)</label>
            <input 
              id="prog-email"
              type="email" 
              placeholder="Ex: carlos.silva@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Cor de Identificação Visual (US-004)</label>
            <span className="form-helper">
              Esta cor representará o programador no Gantt e no Calendário em todos os projetos.
            </span>
            <div className="color-picker-grid">
              {paletaInfo?.paleta?.map(pCor => {
                const emUso = paletaInfo.coresEmUso.includes(pCor) && (!editando || editando.cor !== pCor);
                return (
                  <button
                    key={pCor}
                    type="button"
                    className={`color-option ${cor === pCor ? 'selected' : ''}`}
                    style={{ backgroundColor: pCor }}
                    onClick={() => setCor(pCor)}
                    title={emUso ? `Cor em uso por outro colega (${pCor})` : `Cor disponível (${pCor})`}
                  >
                    {cor === pCor && <span style={{ color: getContrastColor(pCor), fontWeight: 'bold' }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="custom-color-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                id="prog-cor-custom"
                type="color" 
                value={cor} 
                onChange={e => setCor(e.target.value)}
                style={{ width: '40px', height: '40px', padding: '2px', cursor: 'pointer' }}
              />
              <span className="text-sm">Personalizar código HEX: <strong>{cor}</strong></span>
            </div>
          </div>
        </form>
      </Modal>
      
      {/* Modal para Planejamento de Alocações em Múltiplos Períodos e Projetos */}
      <PlanejarAlocacoesModal
        isOpen={!!programadorPlanejamento}
        onClose={() => setProgramadorPlanejamento(null)}
        programador={programadorPlanejamento}
        projetos={projetos}
        alocacoes={alocacoes}
        ausencias={ausencias}
        onSalvarPeriodo={onSalvarPeriodo}
        onExcluirAlocacao={onExcluirAlocacao}
      />
    </div>
  );
}
