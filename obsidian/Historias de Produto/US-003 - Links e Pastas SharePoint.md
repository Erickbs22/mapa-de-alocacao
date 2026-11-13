---
title: "US-003: Vínculo de Links e Pastas SharePoint aos Projetos"
tags:
  - user-story
  - projetos
  - sharepoint
  - fase-1
epic: "Cadastros Base"
priority: "Alta"
story_points: 2
status: "Concluído"
---

# 📖 US-003: Vínculo de Links e Pastas SharePoint aos Projetos

## 👤 Persona & Narrativa de Usuário
> **Como** membro ou líder da equipe técnica,  
> **Quero** anexar múltiplos links externos aos projetos (como pastas do SharePoint, documentação no Jira/Confluence ou repositório Git),  
> **Para que** todos os participantes encontrem os arquivos e documentações oficiais centralizados em um único lugar.

---

## 📝 Critérios de Aceite
- [x] Possibilidade de adicionar múltiplos links por projeto com rótulo amigável (ex: "Pasta SharePoint") e URL.
- [x] Validação de URL obrigatória conforme [[02 - Regras de Negocio (RNs)#RN-04: Formato de Links Externos|RN-04]].
- [x] Links são renderizados como chips clicáveis que abrem em nova aba com `target="_blank"`.
- [x] Endpoints para inclusão e remoção avulsa de links.

---

## 🛠️ Componentes & Endpoints
- **Frontend:** `src/components/ProjetosView.jsx`
- **Backend:** `POST /api/projetos/:id/links`, `DELETE /api/projetos/links/:linkId`
