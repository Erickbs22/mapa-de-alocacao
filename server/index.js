import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, PALETA_CORES, hashSenha, verificarSenha, gerarToken, verificarToken } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware de autorização para o perfil Desenvolvedor (Somente Leitura)
// Bloqueia qualquer tentativa de mutação (POST, PUT, DELETE, PATCH) vinda de um usuário com perfil 'desenvolvedor'
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (req.path === '/api/auth/login') return next();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const decoded = verificarToken(token);
      if (decoded && decoded.perfil === 'desenvolvedor') {
        return res.status(403).json({ 
          error: 'Acesso negado: Usuários com perfil Desenvolvedor possuem permissão apenas para visualização e consumo no produto.' 
        });
      }
    }
  }
  next();
});

// ==========================================
// PROGRAMADORES (US-001, US-004)
// ==========================================

// Listar programadores
app.get('/api/programadores', (req, res) => {
  try {
    const programadores = db.prepare(`
      SELECT id, nome, tecnologias, email, cor, ativo, created_at 
      FROM programadores 
      WHERE ativo = 1 
      ORDER BY nome ASC
    `).all();
    res.json(programadores);
  } catch (err) {
    console.error('Erro ao listar programadores:', err);
    res.status(500).json({ error: 'Erro ao buscar programadores.' });
  }
});

// Paleta de cores com sugestão da próxima livre
app.get('/api/cores-disponiveis', (req, res) => {
  try {
    const emUso = db.prepare('SELECT cor FROM programadores WHERE ativo = 1').all().map(r => r.cor);
    const proxima = PALETA_CORES.find(c => !emUso.includes(c)) || PALETA_CORES[Math.floor(Math.random() * PALETA_CORES.length)];
    res.json({
      paleta: PALETA_CORES,
      coresEmUso: emUso,
      proximaSugerida: proxima
    });
  } catch (err) {
    console.error('Erro ao carregar paleta:', err);
    res.status(500).json({ error: 'Erro ao carregar paleta.' });
  }
});

// Criar programador (RN-02: nome é o único campo obrigatório)
app.post('/api/programadores', (req, res) => {
  try {
    const { nome, tecnologias, email, cor } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do programador é obrigatório (RN-02).' });
    }

    // Se nenhuma cor for informada, pega uma cor livre
    let corEscolhida = cor;
    if (!corEscolhida) {
      const emUso = db.prepare('SELECT cor FROM programadores WHERE ativo = 1').all().map(r => r.cor);
      corEscolhida = PALETA_CORES.find(c => !emUso.includes(c)) || PALETA_CORES[0];
    }

    const stmt = db.prepare(`
      INSERT INTO programadores (nome, tecnologias, email, cor) 
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(nome.trim(), tecnologias ? tecnologias.trim() : '', email ? email.trim() : '', corEscolhida);

    const novo = db.prepare('SELECT * FROM programadores WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro ao cadastrar programador:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar programador.' });
  }
});

// Editar programador
app.put('/api/programadores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tecnologias, email, cor } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do programador é obrigatório.' });
    }

    const stmt = db.prepare(`
      UPDATE programadores 
      SET nome = ?, tecnologias = ?, email = ?, cor = ? 
      WHERE id = ?
    `);
    const result = stmt.run(nome.trim(), tecnologias ? tecnologias.trim() : '', email ? email.trim() : '', cor, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Programador não encontrado.' });
    }

    const atualizado = db.prepare('SELECT * FROM programadores WHERE id = ?').get(id);
    res.json(atualizado);
  } catch (err) {
    console.error('Erro ao atualizar programador:', err);
    res.status(500).json({ error: 'Erro ao atualizar programador.' });
  }
});

// Excluir programador (remoção de vínculos em alocações em cascata)
app.delete('/api/programadores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM programadores WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Programador não encontrado.' });
    }

    res.json({ message: 'Programador removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir programador:', err);
    res.status(500).json({ error: 'Erro ao excluir programador.' });
  }
});

// ==========================================
// PROJETOS E LINKS (US-002, US-003)
// ==========================================

// Listar projetos com links associados
app.get('/api/projetos', (req, res) => {
  try {
    const projetos = db.prepare(`
      SELECT p.id, p.nome, p.descricao, p.status, p.portfolio_id, p.ativo, p.created_at,
             pf.nome as portfolio_nome, pf.cor as portfolio_cor
      FROM projetos p 
      LEFT JOIN portfolios pf ON p.portfolio_id = pf.id
      WHERE p.ativo = 1 
      ORDER BY p.nome ASC
    `).all();

    const linksStmt = db.prepare('SELECT id, projeto_id, rotulo, url FROM projeto_links WHERE projeto_id = ?');

    const result = projetos.map(p => ({
      ...p,
      links: linksStmt.all(p.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('Erro ao listar projetos:', err);
    res.status(500).json({ error: 'Erro ao listar projetos.' });
  }
});

// Criar projeto (P-02)
app.post('/api/projetos', (req, res) => {
  try {
    const { nome, descricao, status, portfolio_id, links } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do projeto é obrigatório.' });
    }

    const stmt = db.prepare(`
      INSERT INTO projetos (nome, descricao, status, portfolio_id) 
      VALUES (?, ?, ?, ?)
    `);
    const projResult = stmt.run(
      nome.trim(), 
      descricao ? descricao.trim() : '', 
      status || 'ativo',
      portfolio_id ? Number(portfolio_id) : null
    );
    const projetoId = Number(projResult.lastInsertRowid);

    // Inserção de links caso existam
    if (Array.isArray(links)) {
      const linkStmt = db.prepare('INSERT INTO projeto_links (projeto_id, rotulo, url) VALUES (?, ?, ?)');
      for (const link of links) {
        if (link.url && link.url.trim()) {
          linkStmt.run(projetoId, link.rotulo?.trim() || 'Link', link.url.trim());
        }
      }
    }

    const projeto = db.prepare('SELECT * FROM projetos WHERE id = ?').get(projetoId);
    projeto.links = db.prepare('SELECT * FROM projeto_links WHERE projeto_id = ?').all(projetoId);

    res.status(201).json(projeto);
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
    res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
});

// Atualizar projeto e seus links
app.put('/api/projetos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, status, portfolio_id, links } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do projeto é obrigatório.' });
    }

    const stmt = db.prepare(`
      UPDATE projetos 
      SET nome = ?, descricao = ?, status = ?, portfolio_id = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      nome.trim(), 
      descricao ? descricao.trim() : '', 
      status || 'ativo', 
      portfolio_id !== undefined ? (portfolio_id ? Number(portfolio_id) : null) : null,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    // Se a lista de links foi enviada, sincronizamos os links
    if (Array.isArray(links)) {
      db.prepare('DELETE FROM projeto_links WHERE projeto_id = ?').run(id);
      const linkStmt = db.prepare('INSERT INTO projeto_links (projeto_id, rotulo, url) VALUES (?, ?, ?)');
      for (const link of links) {
        if (link.url && link.url.trim()) {
          linkStmt.run(id, link.rotulo?.trim() || 'Link', link.url.trim());
        }
      }
    }

    const projeto = db.prepare('SELECT * FROM projetos WHERE id = ?').get(id);
    projeto.links = db.prepare('SELECT * FROM projeto_links WHERE projeto_id = ?').all(id);

    res.json(projeto);
  } catch (err) {
    console.error('Erro ao atualizar projeto:', err);
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
});

// Excluir projeto
app.delete('/api/projetos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM projetos WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    res.json({ message: 'Projeto excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir projeto:', err);
    res.status(500).json({ error: 'Erro ao excluir projeto.' });
  }
});

// Adicionar link avulso ao projeto (US-003)
app.post('/api/projetos/:id/links', (req, res) => {
  try {
    const { id } = req.params;
    const { rotulo, url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'A URL do link é obrigatória.' });
    }

    const stmt = db.prepare('INSERT INTO projeto_links (projeto_id, rotulo, url) VALUES (?, ?, ?)');
    const result = stmt.run(id, rotulo?.trim() || 'Link', url.trim());

    const novoLink = db.prepare('SELECT * FROM projeto_links WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(novoLink);
  } catch (err) {
    console.error('Erro ao adicionar link:', err);
    res.status(500).json({ error: 'Erro ao adicionar link.' });
  }
});

// Remover link avulso
app.delete('/api/projetos/links/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    const stmt = db.prepare('DELETE FROM projeto_links WHERE id = ?');
    const result = stmt.run(linkId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Link não encontrado.' });
    }

    res.json({ message: 'Link excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover link:', err);
    res.status(500).json({ error: 'Erro ao remover link.' });
  }
});

// ==========================================
// ALOCAÇÕES (US-005, US-007, US-008, US-009)
// ==========================================

// Listar alocações (com filtros opcionais por data)
app.get('/api/alocacoes', (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    let query = `
      SELECT a.*, 
             p.nome as programador_nome, p.cor as programador_cor,
             pr.nome as projeto_nome
      FROM alocacoes a
      JOIN programadores p ON a.programador_id = p.id
      JOIN projetos pr ON a.projeto_id = pr.id
    `;
    const params = [];

    if (data_inicio && data_fim) {
      query += ` WHERE a.data BETWEEN ? AND ? `;
      params.push(data_inicio, data_fim);
    }

    query += ` ORDER BY a.data ASC, pr.nome ASC `;

    const alocacoes = db.prepare(query).all(...params);
    res.json(alocacoes);
  } catch (err) {
    console.error('Erro ao listar alocações:', err);
    res.status(500).json({ error: 'Erro ao buscar alocações.' });
  }
});

// Criar alocação (padrão 8h / dia todo, RN-07)
app.post('/api/alocacoes', (req, res) => {
  try {
    const { programador_id, projeto_id, data, dia_todo, horas, observacao } = req.body;

    if (!programador_id || !projeto_id || !data) {
      return res.status(400).json({ error: 'Programador, projeto e data são obrigatórios.' });
    }

    const isDiaTodo = dia_todo !== undefined ? (dia_todo ? 1 : 0) : 1;
    const qtdHoras = isDiaTodo ? 8.0 : (Number(horas) || 8.0);

    const stmt = db.prepare(`
      INSERT INTO alocacoes (programador_id, projeto_id, data, dia_todo, horas, observacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(programador_id, projeto_id, data, isDiaTodo, qtdHoras, observacao || '');

    const novaAlocacao = db.prepare(`
      SELECT a.*, 
             p.nome as programador_nome, p.cor as programador_cor,
             pr.nome as projeto_nome
      FROM alocacoes a
      JOIN programadores p ON a.programador_id = p.id
      JOIN projetos pr ON a.projeto_id = pr.id
      WHERE a.id = ?
    `).get(Number(result.lastInsertRowid));

    res.status(201).json(novaAlocacao);
  } catch (err) {
    console.error('Erro ao criar alocação:', err);
    res.status(500).json({ error: 'Erro ao registrar alocação.' });
  }
});

// Atualizar alocação (US-008, RN-08)
app.put('/api/alocacoes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { programador_id, projeto_id, data, dia_todo, horas, observacao } = req.body;

    const isDiaTodo = dia_todo !== undefined ? (dia_todo ? 1 : 0) : 1;
    const qtdHoras = isDiaTodo ? 8.0 : (Number(horas) || 8.0);

    const stmt = db.prepare(`
      UPDATE alocacoes 
      SET 
        programador_id = COALESCE(?, programador_id),
        projeto_id = COALESCE(?, projeto_id),
        data = COALESCE(?, data),
        dia_todo = ?, 
        horas = ?, 
        observacao = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      programador_id || null,
      projeto_id || null,
      data || null,
      isDiaTodo, 
      qtdHoras, 
      observacao || '', 
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alocação não encontrada.' });
    }

    const alocacaoAtualizada = db.prepare(`
      SELECT a.*, 
             p.nome as programador_nome, p.cor as programador_cor,
             pr.nome as projeto_nome
      FROM alocacoes a
      JOIN programadores p ON a.programador_id = p.id
      JOIN projetos pr ON a.projeto_id = pr.id
      WHERE a.id = ?
    `).get(id);

    res.json(alocacaoAtualizada);
  } catch (err) {
    console.error('Erro ao atualizar alocação:', err);
    res.status(500).json({ error: 'Erro ao atualizar alocação.' });
  }
});

// Excluir alocação
app.delete('/api/alocacoes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM alocacoes WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Alocação não encontrada.' });
    }

    res.json({ message: 'Alocação excluída com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir alocação:', err);
    res.status(500).json({ error: 'Erro ao excluir alocação.' });
  }
});

// Criar alocações em lote por período (centrado no programador)
app.post('/api/alocacoes/periodo', (req, res) => {
  try {
    const {
      programador_id,
      projeto_id,
      data_inicio,
      data_fim,
      apenas_dias_uteis = true,
      dia_todo = true,
      horas = 8.0,
      observacao = '',
      modo_conflito = 'somar'
    } = req.body;

    if (!programador_id || !projeto_id || !data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Programador, projeto, data de início e fim são obrigatórios.' });
    }

    if (data_inicio > data_fim) {
      return res.status(400).json({ error: 'A data inicial não pode ser maior que a data final.' });
    }

    const cur = new Date(data_inicio + 'T00:00:00');
    const end = new Date(data_fim + 'T00:00:00');
    const datasValidas = [];

    while (cur <= end) {
      const day = cur.getDay(); // 0 = Domingo, 6 = Sábado
      if (!apenas_dias_uteis || (day !== 0 && day !== 6)) {
        datasValidas.push(cur.toISOString().split('T')[0]);
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (datasValidas.length === 0) {
      return res.status(400).json({ error: 'Nenhuma data válida encontrada no intervalo selecionado.' });
    }

    const isDiaTodo = dia_todo ? 1 : 0;
    const qtdHoras = isDiaTodo ? 8.0 : (Number(horas) || 8.0);

    db.exec('BEGIN TRANSACTION;');
    try {
      const stmtDeleteExisting = db.prepare(`
        DELETE FROM alocacoes 
        WHERE programador_id = ? AND projeto_id = ? AND data = ?
      `);

      const stmtDeleteAllOnDate = db.prepare(`
        DELETE FROM alocacoes 
        WHERE programador_id = ? AND data = ?
      `);

      const stmtInsert = db.prepare(`
        INSERT INTO alocacoes (programador_id, projeto_id, data, dia_todo, horas, observacao)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      let totalCriadas = 0;

      for (const dataIso of datasValidas) {
        if (modo_conflito === 'substituir_tudo') {
          stmtDeleteAllOnDate.run(programador_id, dataIso);
        } else {
          stmtDeleteExisting.run(programador_id, projeto_id, dataIso);
        }

        stmtInsert.run(programador_id, projeto_id, dataIso, isDiaTodo, qtdHoras, observacao || '');
        totalCriadas++;
      }

      db.exec('COMMIT;');

      res.status(201).json({
        message: `${totalCriadas} alocação(ões) criada(s) com sucesso para o período!`,
        totalCriadas,
        datas: datasValidas
      });
    } catch (innerErr) {
      db.exec('ROLLBACK;');
      console.error('Erro na transação de alocação por período:', innerErr);
      res.status(500).json({ error: 'Erro ao registrar alocações no período: ' + innerErr.message });
    }
  } catch (err) {
    console.error('Erro ao processar alocação por período:', err);
    res.status(500).json({ error: 'Erro interno ao processar alocação por período.' });
  }
});

// Criar ou replicar alocações em lote (usado pela alça de preenchimento / Drag-to-Fill)
app.post('/api/alocacoes/lote', (req, res) => {
  try {
    const { alocacoes } = req.body;
    if (!Array.isArray(alocacoes) || alocacoes.length === 0) {
      return res.status(400).json({ error: 'Lista de alocações inválida ou vazia.' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      const stmtDeleteExisting = db.prepare(`
        DELETE FROM alocacoes 
        WHERE programador_id = ? AND projeto_id = ? AND data = ?
      `);

      const stmtInsert = db.prepare(`
        INSERT INTO alocacoes (programador_id, projeto_id, data, dia_todo, horas, observacao)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      let totalCriadas = 0;
      for (const item of alocacoes) {
        if (!item.programador_id || !item.projeto_id || !item.data) continue;
        stmtDeleteExisting.run(item.programador_id, item.projeto_id, item.data);
        const isDiaTodo = item.dia_todo !== undefined ? (item.dia_todo ? 1 : 0) : 1;
        const qtdHoras = isDiaTodo ? 8.0 : (Number(item.horas) || 8.0);
        stmtInsert.run(item.programador_id, item.projeto_id, item.data, isDiaTodo, qtdHoras, item.observacao || '');
        totalCriadas++;
      }

      db.exec('COMMIT;');
      res.status(201).json({
        message: `${totalCriadas} dia(s) preenchido(s) com sucesso!`,
        totalCriadas
      });
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    console.error('Erro ao salvar alocações em lote:', err);
    res.status(500).json({ error: 'Erro ao processar preenchimento em lote: ' + err.message });
  }
});

// ==========================================
// ROTAS DE AUSÊNCIAS (Férias, Folgas, Feriados — US-021)
// ==========================================

// Listar todas as ausências cadastradas com dados do programador
app.get('/api/ausencias', (req, res) => {
  try {
    const ausencias = db.prepare(`
      SELECT a.*, p.nome as programador_nome, p.cor as programador_cor
      FROM ausencias a
      LEFT JOIN programadores p ON a.programador_id = p.id
      ORDER BY a.data_inicio ASC
    `).all();
    res.json(ausencias);
  } catch (err) {
    console.error('Erro ao listar ausências:', err);
    res.status(500).json({ error: 'Erro ao listar ausências.' });
  }
});

// Cadastrar nova ausência / férias / feriado
app.post('/api/ausencias', (req, res) => {
  try {
    const { programador_id, tipo, data_inicio, data_fim, descricao } = req.body;

    if (!tipo || !['ferias', 'folga', 'licenca', 'feriado', 'outro'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de ausência inválido. Valores aceitos: ferias, folga, licenca, feriado, outro.' });
    }

    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Data de início e data de fim são obrigatórias.' });
    }

    if (data_inicio > data_fim) {
      return res.status(400).json({ error: 'A data de início não pode ser posterior à data de término.' });
    }

    // Se não for feriado corporativo geral, exige o programador
    if (tipo !== 'feriado' && !programador_id) {
      return res.status(400).json({ error: 'O programador é obrigatório para férias ou folgas individuais.' });
    }

    const stmt = db.prepare(`
      INSERT INTO ausencias (programador_id, tipo, data_inicio, data_fim, descricao)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      programador_id ? Number(programador_id) : null,
      tipo,
      data_inicio,
      data_fim,
      descricao ? descricao.trim() : ''
    );

    const novaAusencia = db.prepare(`
      SELECT a.*, p.nome as programador_nome, p.cor as programador_cor
      FROM ausencias a
      LEFT JOIN programadores p ON a.programador_id = p.id
      WHERE a.id = ?
    `).get(Number(result.lastInsertRowid));

    res.status(201).json(novaAusencia);
  } catch (err) {
    console.error('Erro ao cadastrar ausência:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar ausência.' });
  }
});

// Excluir ausência
app.delete('/api/ausencias/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM ausencias WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro de ausência não encontrado.' });
    }

    res.json({ message: 'Registro de ausência excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir ausência:', err);
    res.status(500).json({ error: 'Erro ao excluir ausência.' });
  }
});

// ==========================================
// ROTAS DE PORTFÓLIOS (US-015)
// ==========================================

// Listar todos os portfólios com contagem de projetos associados
app.get('/api/portfolios', (req, res) => {
  try {
    const portfolios = db.prepare(`
      SELECT pf.*, COUNT(p.id) as projetos_count
      FROM portfolios pf
      LEFT JOIN projetos p ON p.portfolio_id = pf.id AND p.ativo = 1
      WHERE pf.ativo = 1
      GROUP BY pf.id
      ORDER BY pf.nome ASC
    `).all();
    res.json(portfolios);
  } catch (err) {
    console.error('Erro ao listar portfólios:', err);
    res.status(500).json({ error: 'Erro ao listar portfólios.' });
  }
});

// Criar novo portfólio
app.post('/api/portfolios', (req, res) => {
  try {
    const { nome, descricao, cor, gestor_responsavel } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do portfólio é obrigatório.' });
    }

    const stmt = db.prepare(`
      INSERT INTO portfolios (nome, descricao, cor, gestor_responsavel)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      nome.trim(),
      descricao ? descricao.trim() : '',
      cor || '#2563EB',
      gestor_responsavel ? gestor_responsavel.trim() : ''
    );

    const novo = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(Number(result.lastInsertRowid));
    novo.projetos_count = 0;
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro ao criar portfólio:', err);
    res.status(500).json({ error: 'Erro ao criar portfólio.' });
  }
});

// Atualizar portfólio
app.put('/api/portfolios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, cor, gestor_responsavel } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do portfólio é obrigatório.' });
    }

    const stmt = db.prepare(`
      UPDATE portfolios
      SET nome = ?, descricao = ?, cor = ?, gestor_responsavel = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      nome.trim(),
      descricao ? descricao.trim() : '',
      cor || '#2563EB',
      gestor_responsavel ? gestor_responsavel.trim() : '',
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Portfólio não encontrado.' });
    }

    const atualizado = db.prepare(`
      SELECT pf.*, COUNT(p.id) as projetos_count
      FROM portfolios pf
      LEFT JOIN projetos p ON p.portfolio_id = pf.id AND p.ativo = 1
      WHERE pf.id = ?
      GROUP BY pf.id
    `).get(id);

    res.json(atualizado);
  } catch (err) {
    console.error('Erro ao atualizar portfólio:', err);
    res.status(500).json({ error: 'Erro ao atualizar portfólio.' });
  }
});

// Excluir portfólio (desvincula projetos setando portfolio_id = NULL)
app.delete('/api/portfolios/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE projetos SET portfolio_id = NULL WHERE portfolio_id = ?').run(id);
    db.prepare('UPDATE usuarios SET portfolio_id = NULL WHERE portfolio_id = ?').run(id);
    const stmt = db.prepare('DELETE FROM portfolios WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Portfólio não encontrado.' });
    }

    res.json({ message: 'Portfólio excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir portfólio:', err);
    res.status(500).json({ error: 'Erro ao excluir portfólio.' });
  }
});

// ==========================================
// AUTENTICAÇÃO E GESTÃO DE USUÁRIOS (US-016)
// ==========================================

// Login corporativo
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Informe o e-mail corporativo e a senha.' });
    }

    const usuario = db.prepare(`
      SELECT u.*, pf.nome as portfolio_nome, pf.cor as portfolio_cor
      FROM usuarios u
      LEFT JOIN portfolios pf ON u.portfolio_id = pf.id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email.trim());

    if (!usuario || !verificarSenha(senha, usuario.senha_hash)) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ error: 'Este usuário está desativado. Contate o administrador.' });
    }

    const token = gerarToken(usuario);
    const { senha_hash: _sh, ...usuarioSeguro } = usuario;

    res.json({
      token,
      usuario: usuarioSeguro
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao processar autenticação.' });
  }
});

// Validar sessão atual (Bearer token)
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const decoded = verificarToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const usuario = db.prepare(`
      SELECT u.id, u.nome, u.email, u.perfil, u.portfolio_id, u.ativo, u.created_at,
             pf.nome as portfolio_nome, pf.cor as portfolio_cor
      FROM usuarios u
      LEFT JOIN portfolios pf ON u.portfolio_id = pf.id
      WHERE u.id = ? AND u.ativo = 1
    `).get(decoded.id);

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    res.json({ usuario });
  } catch (err) {
    console.error('Erro ao validar sessão:', err);
    res.status(500).json({ error: 'Erro ao validar sessão.' });
  }
});

// Listar todos os usuários (Admin)
app.get('/api/usuarios', (req, res) => {
  try {
    const usuarios = db.prepare(`
      SELECT u.id, u.nome, u.email, u.perfil, u.portfolio_id, u.ativo, u.created_at,
             pf.nome as portfolio_nome, pf.cor as portfolio_cor
      FROM usuarios u
      LEFT JOIN portfolios pf ON u.portfolio_id = pf.id
      ORDER BY CASE WHEN u.perfil = 'admin' THEN 0 ELSE 1 END, u.nome ASC
    `).all();
    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// Criar novo usuário (Admin ou Gerente de Produto)
app.post('/api/usuarios', (req, res) => {
  try {
    const { nome, email, senha, perfil = 'gerente', portfolio_id, ativo = 1 } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do usuário é obrigatório.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'O e-mail corporativo é obrigatório.' });
    }
    if (!senha || String(senha).length < 4) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 4 caracteres.' });
    }
    if (!['admin', 'gerente', 'desenvolvedor'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido. Escolha admin, gerente ou desenvolvedor.' });
    }

    const existente = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existente) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const stmt = db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil, portfolio_id, ativo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      nome.trim(),
      email.trim().toLowerCase(),
      hashSenha(senha),
      perfil,
      perfil === 'gerente' && portfolio_id ? Number(portfolio_id) : null,
      ativo ? 1 : 0
    );

    const novo = db.prepare(`
      SELECT u.id, u.nome, u.email, u.perfil, u.portfolio_id, u.ativo, u.created_at,
             pf.nome as portfolio_nome, pf.cor as portfolio_cor
      FROM usuarios u
      LEFT JOIN portfolios pf ON u.portfolio_id = pf.id
      WHERE u.id = ?
    `).get(Number(result.lastInsertRowid));

    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// Atualizar usuário existente
app.put('/api/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, perfil = 'gerente', portfolio_id, ativo = 1 } = req.body;

    if (!nome || !nome.trim() || !email || !email.trim()) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    if (!['admin', 'gerente', 'desenvolvedor'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido. Escolha admin, gerente ou desenvolvedor.' });
    }

    const duplicado = db.prepare('SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) AND id != ?').get(email.trim(), id);
    if (duplicado) {
      return res.status(400).json({ error: 'Este e-mail já está em uso por outro usuário.' });
    }

    const portfolioFinal = perfil === 'gerente' && portfolio_id ? Number(portfolio_id) : null;

    if (senha && String(senha).trim().length > 0) {
      if (String(senha).trim().length < 4) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 4 caracteres.' });
      }
      db.prepare(`
        UPDATE usuarios
        SET nome = ?, email = ?, senha_hash = ?, perfil = ?, portfolio_id = ?, ativo = ?
        WHERE id = ?
      `).run(nome.trim(), email.trim().toLowerCase(), hashSenha(senha.trim()), perfil, portfolioFinal, ativo ? 1 : 0, id);
    } else {
      db.prepare(`
        UPDATE usuarios
        SET nome = ?, email = ?, perfil = ?, portfolio_id = ?, ativo = ?
        WHERE id = ?
      `).run(nome.trim(), email.trim().toLowerCase(), perfil, portfolioFinal, ativo ? 1 : 0, id);
    }

    const atualizado = db.prepare(`
      SELECT u.id, u.nome, u.email, u.perfil, u.portfolio_id, u.ativo, u.created_at,
             pf.nome as portfolio_nome, pf.cor as portfolio_cor
      FROM usuarios u
      LEFT JOIN portfolios pf ON u.portfolio_id = pf.id
      WHERE u.id = ?
    `).get(id);

    if (!atualizado) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(atualizado);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// Excluir usuário
app.delete('/api/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const alvo = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!alvo) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (alvo.perfil === 'admin') {
      const totalAdmins = db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE perfil = 'admin' AND ativo = 1").get();
      if (totalAdmins && totalAdmins.count <= 1) {
        return res.status(400).json({ error: 'Não é possível excluir o único administrador ativo do sistema.' });
      }
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ message: 'Usuário removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// ==========================================
// BACKUP / EXPORT / IMPORT
// ==========================================
app.get('/api/backup/export', (req, res) => {
  try {
    const portfolios = db.prepare('SELECT * FROM portfolios').all();
    const usuarios = db.prepare('SELECT id, nome, email, perfil, portfolio_id, ativo, created_at FROM usuarios').all();
    const programadores = db.prepare('SELECT * FROM programadores').all();
    const projetos = db.prepare('SELECT * FROM projetos').all();
    const links = db.prepare('SELECT * FROM projeto_links').all();
    const alocacoes = db.prepare('SELECT * FROM alocacoes').all();
    const ausencias = db.prepare('SELECT * FROM ausencias').all();

    res.json({
      timestamp: new Date().toISOString(),
      versao: '1.2.0',
      data: {
        portfolios,
        usuarios,
        programadores,
        projetos,
        projeto_links: links,
        alocacoes,
        ausencias
      }
    });
  } catch (err) {
    console.error('Erro ao gerar backup:', err);
    res.status(500).json({ error: 'Erro ao gerar backup.' });
  }
});

// Importar / Restaurar Backup completo (Fase 3)
app.post('/api/backup/import', (req, res) => {
  try {
    const payload = req.body;
    const backupData = payload?.data || payload;

    if (!backupData || !Array.isArray(backupData.programadores) || !Array.isArray(backupData.projetos)) {
      return res.status(400).json({ error: 'Arquivo de backup inválido ou formato incompatível.' });
    }

    const { portfolios = [], programadores = [], projetos = [], projeto_links = [], alocacoes = [], ausencias = [] } = backupData;

    db.exec('BEGIN TRANSACTION;');
    try {
      // Limpeza das tabelas atuais
      db.exec('DELETE FROM ausencias;');
      db.exec('DELETE FROM alocacoes;');
      db.exec('DELETE FROM projeto_links;');
      db.exec('DELETE FROM projetos;');
      db.exec('UPDATE usuarios SET portfolio_id = NULL;');
      db.exec('DELETE FROM portfolios;');
      db.exec('DELETE FROM programadores;');

      // Inserção de portfólios
      const stmtPort = db.prepare(`
        INSERT INTO portfolios (id, nome, descricao, cor, gestor_responsavel, ativo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `);
      for (const pf of portfolios) {
        stmtPort.run(
          pf.id,
          pf.nome,
          pf.descricao || '',
          pf.cor || '#2563EB',
          pf.gestor_responsavel || '',
          pf.ativo !== undefined ? pf.ativo : 1,
          pf.created_at || null
        );
      }

      // Inserção de programadores
      const stmtProg = db.prepare(`
        INSERT INTO programadores (id, nome, tecnologias, email, cor, ativo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `);
      for (const p of programadores) {
        stmtProg.run(
          p.id, 
          p.nome, 
          p.tecnologias || '', 
          p.email || '', 
          p.cor || PALETA_CORES[0], 
          p.ativo !== undefined ? p.ativo : 1, 
          p.created_at || null
        );
      }

      // Inserção de projetos
      const stmtProj = db.prepare(`
        INSERT INTO projetos (id, portfolio_id, nome, descricao, status, ativo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `);
      for (const pr of projetos) {
        stmtProj.run(
          pr.id, 
          pr.portfolio_id || null,
          pr.nome, 
          pr.descricao || '', 
          pr.status || 'ativo', 
          pr.ativo !== undefined ? pr.ativo : 1, 
          pr.created_at || null
        );
      }

      // Inserção de links
      const stmtLink = db.prepare(`
        INSERT INTO projeto_links (id, projeto_id, rotulo, url, created_at)
        VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `);
      for (const l of projeto_links) {
        stmtLink.run(
          l.id, 
          l.projeto_id, 
          l.rotulo || 'Link', 
          l.url, 
          l.created_at || null
        );
      }

      // Inserção de alocações
      const stmtAloc = db.prepare(`
        INSERT INTO alocacoes (id, programador_id, projeto_id, data, dia_todo, horas, observacao, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `);
      for (const a of alocacoes) {
        stmtAloc.run(
          a.id,
          a.programador_id,
          a.projeto_id,
          a.data,
          a.dia_todo !== undefined ? a.dia_todo : 1,
          a.horas !== undefined ? a.horas : 8.0,
          a.observacao || '',
          a.created_at || null
        );
      }

      // Inserção de ausências
      const stmtAus = db.prepare(`
        INSERT INTO ausencias (id, programador_id, tipo, data_inicio, data_fim, descricao, created_at)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `);
      for (const au of ausencias) {
        stmtAus.run(
          au.id,
          au.programador_id || null,
          au.tipo || 'ferias',
          au.data_inicio,
          au.data_fim,
          au.descricao || '',
          au.created_at || null
        );
      }

      db.exec('COMMIT;');

      res.json({
        message: 'Backup restaurado com sucesso!',
        resumo: {
          programadores: programadores.length,
          projetos: projetos.length,
          links: projeto_links.length,
          alocacoes: alocacoes.length,
          ausencias: ausencias.length
        }
      });
    } catch (innerErr) {
      db.exec('ROLLBACK;');
      console.error('Erro na transação de restauração:', innerErr);
      res.status(500).json({ error: 'Erro ao restaurar dados: ' + innerErr.message });
    }
  } catch (err) {
    console.error('Erro no endpoint de importação:', err);
    res.status(500).json({ error: 'Falha interna ao processar backup.' });
  }
});

// Servir arquivos estáticos do frontend em produção (pasta dist)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback para SPA (qualquer rota que não seja /api retorna o index.html)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend rodando com sucesso em http://localhost:${PORT}`);
  if (fs.existsSync(distPath)) {
    console.log(`Frontend em produção integrado e ativo na mesma porta!`);
  }
});
