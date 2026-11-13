---
title: "US-014: Backup Integral e Restauração em JSON"
tags:
  - user-story
  - confiabilidade
  - backup
  - seguranca
  - fase-3
epic: "Confiabilidade & Governança"
priority: "Alta"
story_points: 3
status: "Concluído"
---

# 📖 US-014: Backup Integral e Restauração em JSON

## 👤 Persona & Narrativa de Usuário
> **Como** administrador do sistema ou usuário responsável pela base de dados,  
> **Quero** poder exportar todo o banco de dados em um arquivo JSON e restaurá-lo com segurança através de uma área de upload (dropzone),  
> **Para que** eu tenha garantia de contingência contra perda de dados ou consiga migrar o sistema para outra máquina sem esforço.

---

## 📝 Critérios de Aceite
- [x] O botão "Exportar" na Navbar gera um arquivo `backup_mapa_alocacao_YYYY-MM-DD.json` contendo todas as tabelas: `programadores`, `projetos`, `projeto_links` e `alocacoes`.
- [x] O botão "Importar" abre modal com área de arraste (*drag & drop*) de arquivos `.json`.
- [x] Leitura imediata com prévia analítica exibindo contagem de programadores, projetos, links e alocações antes da confirmação.
- [x] Validação estrutural do arquivo conforme [[02 - Regras de Negocio (RNs)#RN-12: Integridade Estrutural de Backups|RN-12]] rejeitando arquivos malformados.
- [x] Execução dentro de transação atômica SQLite garantindo substituição íntegra sem deixar tabelas inconsistentes.

---

## 🛠️ Componentes & Endpoints
- **Frontend:** `src/components/ImportBackupModal.jsx`, `src/components/Navbar.jsx`
- **Backend:** `GET /api/backup/export`, `POST /api/backup/import`
