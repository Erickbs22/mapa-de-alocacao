import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import crypto from 'node:crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'benner-mapa-alocacao-secret-key-2026';

export function hashSenha(senha) {
  const salt = 'benner_salt_v1';
  return crypto.scryptSync(String(senha), salt, 32).toString('hex');
}

export function verificarSenha(senhaDigitada, hashArmazenado) {
  return hashSenha(senhaDigitada) === hashArmazenado;
}

export function gerarToken(usuario) {
  const payload = Buffer.from(JSON.stringify({
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil,
    portfolio_id: usuario.portfolio_id || null,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verificarToken(token) {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payloadB64, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o diretório server/data exista
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mapa_alocacao.sqlite');
export const db = new DatabaseSync(dbPath);

// Ativa foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS programadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tecnologias TEXT,
    email TEXT,
    cor TEXT NOT NULL,
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    cor TEXT DEFAULT '#2563EB',
    gestor_responsavel TEXT,
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER,
    nome TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'ativo',
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS projeto_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projeto_id INTEGER NOT NULL,
    rotulo TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS alocacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    programador_id INTEGER NOT NULL,
    projeto_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    dia_todo INTEGER DEFAULT 1,
    horas REAL DEFAULT 8.0,
    observacao TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (programador_id) REFERENCES programadores(id) ON DELETE CASCADE,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ausencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    programador_id INTEGER,
    tipo TEXT NOT NULL DEFAULT 'ferias',
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL,
    descricao TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (programador_id) REFERENCES programadores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'gerente',
    portfolio_id INTEGER,
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
  );
`);

// Migração retroativa: garante que portfolio_id exista na tabela projetos se ela já existia antes
try {
  const colunasProjetos = db.prepare('PRAGMA table_info(projetos)').all();
  const temPortfolioId = colunasProjetos.some(c => c.name === 'portfolio_id');
  if (!temPortfolioId) {
    db.exec('ALTER TABLE projetos ADD COLUMN portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE SET NULL;');
  }
} catch (err) {
  console.error('Erro ao verificar/adicionar coluna portfolio_id:', err);
}

// Cores padrão sugeridas
export const PALETA_CORES = [
  '#2563EB', // Azul Royal
  '#059669', // Esmeralda
  '#D97706', // Âmbar
  '#7C3AED', // Violeta
  '#DB2777', // Rosa
  '#0891B2', // Ciano
  '#EA580C', // Laranja Coral
  '#0D9488', // Teal
  '#4F46E5', // Índigo
  '#65A30D', // Verde Lima
  '#C026D3', // Fúcsia
  '#E11D48'  // Carmim
];

// Seed inicial se o banco estiver vazio
const countProg = db.prepare('SELECT COUNT(*) as count FROM programadores').get();
if (countProg && countProg.count === 0) {
  const insertProg = db.prepare('INSERT INTO programadores (nome, tecnologias, email, cor) VALUES (?, ?, ?, ?)');
  insertProg.run('Carlos Silva', 'C#, .NET, SQL Server', 'carlos.silva@empresa.com', PALETA_CORES[0]);
  insertProg.run('Ana Oliveira', 'React, TypeScript, CSS', 'ana.oliveira@empresa.com', PALETA_CORES[1]);
  insertProg.run('Erick Souza', 'Node.js, Python, Arquitetura', 'erick.souza@empresa.com', PALETA_CORES[2]);
  insertProg.run('Mariana Costa', 'Vue.js, UX/UI, Tailwind', 'mariana.costa@empresa.com', PALETA_CORES[3]);
  insertProg.run('Lucas Fernandes', 'Java, Spring Boot, Docker', 'lucas.fernandes@empresa.com', PALETA_CORES[4]);

  const insertProj = db.prepare('INSERT INTO projetos (nome, descricao, status) VALUES (?, ?, ?)');
  const proj1 = insertProj.run('Benner Finance - Core', 'Módulo financeiro principal e conciliação bancária', 'ativo');
  const proj2 = insertProj.run('Portal de Sinistros & Saúde', 'Atendimento web e autorizações de procedimentos', 'ativo');
  const proj3 = insertProj.run('App Mobile Gestão', 'Aplicativo mobile para aprovação de solicitações', 'ativo');

  const insertLink = db.prepare('INSERT INTO projeto_links (projeto_id, rotulo, url) VALUES (?, ?, ?)');
  insertLink.run(Number(proj1.lastInsertRowid), 'Pasta SharePoint Financeiro', 'https://benner.sharepoint.com/sites/financeiro');
  insertLink.run(Number(proj1.lastInsertRowid), 'Repositório GitHub', 'https://github.com/benner/finance-core');
  insertLink.run(Number(proj2.lastInsertRowid), 'Documentação Jira / Confluence', 'https://benner.atlassian.net/wiki/sinistros');
  insertLink.run(Number(proj3.lastInsertRowid), 'Figma Mobile UI', 'https://figma.com/file/benner-mobile-app');
}

// Seed de alocações de exemplo para demonstração na data atual
const countAloc = db.prepare('SELECT COUNT(*) as count FROM alocacoes').get();
if (countAloc && countAloc.count === 0) {
  const insertAloc = db.prepare('INSERT INTO alocacoes (programador_id, projeto_id, data, dia_todo, horas, observacao) VALUES (?, ?, ?, ?, ?, ?)');
  
  const hoje = new Date();
  const d0 = hoje.toISOString().split('T')[0];
  
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const d1 = amanha.toISOString().split('T')[0];

  const depois = new Date(hoje);
  depois.setDate(hoje.getDate() + 2);
  const d2 = depois.toISOString().split('T')[0];

  const progs = db.prepare('SELECT id FROM programadores ORDER BY id ASC LIMIT 3').all();
  const projs = db.prepare('SELECT id FROM projetos ORDER BY id ASC LIMIT 2').all();

  if (progs.length >= 2 && projs.length >= 2) {
    insertAloc.run(progs[0].id, projs[0].id, d0, 1, 8.0, 'Início do sprint de conciliação');
    insertAloc.run(progs[1].id, projs[0].id, d0, 1, 8.0, 'Desenvolvimento das telas no React');
    insertAloc.run(progs[0].id, projs[0].id, d1, 1, 8.0, 'Continuação das APIs');
    insertAloc.run(progs[1].id, projs[1].id, d1, 0, 4.0, 'Suporte no portal de sinistros');
    if (progs[2]) {
      insertAloc.run(progs[2].id, projs[1].id, d2, 1, 8.0, 'Arquitetura e testes');
    }
  }
}

// Seed inicial de ausências se a tabela estiver vazia
const countAusencias = db.prepare('SELECT COUNT(*) as count FROM ausencias').get();
if (countAusencias && countAusencias.count === 0) {
  const progs = db.prepare('SELECT id FROM programadores ORDER BY id ASC LIMIT 2').all();
  if (progs.length > 0) {
    const insertAusencia = db.prepare('INSERT INTO ausencias (programador_id, tipo, data_inicio, data_fim, descricao) VALUES (?, ?, ?, ?, ?)');
    const hoje = new Date();
    // Exemplo: 4 dias a partir de 3 dias no futuro para o primeiro desenvolvedor
    const dInicio = new Date(hoje);
    dInicio.setDate(hoje.getDate() + 3);
    const dFim = new Date(hoje);
    dFim.setDate(hoje.getDate() + 6);
    insertAusencia.run(
      progs[0].id,
      'ferias',
      dInicio.toISOString().split('T')[0],
      dFim.toISOString().split('T')[0],
      'Férias programadas'
    );
  }
}

// Seed inicial de portfólios se a tabela estiver vazia (US-015)
const countPortfolios = db.prepare('SELECT COUNT(*) as count FROM portfolios').get();
if (countPortfolios && countPortfolios.count === 0) {
  const insertPort = db.prepare('INSERT INTO portfolios (nome, descricao, cor, gestor_responsavel) VALUES (?, ?, ?, ?)');
  const p1 = insertPort.run('Benner Gestão Financeira', 'Sistemas de faturamento, conciliação e tesouraria', '#2563EB', 'Carlos Silva');
  const p2 = insertPort.run('Benner Saúde & Operações', 'Portais assistenciais, sinistros e app mobile', '#059669', 'Mariana Costa');

  // Vincula projetos existentes aos portfólios criados
  const projs = db.prepare('SELECT id, nome FROM projetos ORDER BY id ASC').all();
  if (projs.length > 0) {
    const updateProjPort = db.prepare('UPDATE projetos SET portfolio_id = ? WHERE id = ?');
    for (let i = 0; i < projs.length; i++) {
      const portId = i === 0 ? Number(p1.lastInsertRowid) : Number(p2.lastInsertRowid);
      updateProjPort.run(portId, projs[i].id);
    }
  }
}

// Seed inicial de usuários e gerentes de produto se a tabela estiver vazia (US-016)
const countUsuarios = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
if (countUsuarios && countUsuarios.count === 0) {
  const ports = db.prepare('SELECT id, nome FROM portfolios ORDER BY id ASC').all();
  const portFinId = ports[0]?.id || null;
  const portSaudeId = ports[1]?.id || portFinId;

  const insertUser = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil, portfolio_id, ativo)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  insertUser.run(
    'Erick Souza (Admin Geral)',
    'admin@benner.com.br',
    hashSenha('admin123'),
    'admin',
    null
  );

  insertUser.run(
    'Carlos Silva (PM Financeiro)',
    'carlos.silva@benner.com.br',
    hashSenha('123456'),
    'gerente',
    portFinId
  );

  insertUser.run(
    'Mariana Costa (PM Saúde)',
    'mariana.costa@benner.com.br',
    hashSenha('123456'),
    'gerente',
    portSaudeId
  );

  insertUser.run(
    'Lucas Mendes (Dev Team)',
    'dev@benner.com.br',
    hashSenha('dev123'),
    'desenvolvedor',
    null
  );
}

// Garante existência do usuário desenvolvedor para teste mesmo em bases já semeadas
try {
  const usuarioDevExiste = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = ?').get('dev@benner.com.br');
  if (!usuarioDevExiste) {
    db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil, portfolio_id, ativo)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      'Lucas Mendes (Desenvolvedor)',
      'dev@benner.com.br',
      hashSenha('dev123'),
      'desenvolvedor',
      null
    );
  }
} catch (e) {
  console.error('Erro ao verificar usuário dev:', e);
}


