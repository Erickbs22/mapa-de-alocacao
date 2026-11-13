---
title: "US-002: Cadastro e Gestão de Projetos"
tags:
  - user-story
  - projetos
  - cadastros
  - fase-1
epic: "Cadastros Base"
priority: "Crítica"
story_points: 3
status: "Concluído"
---

# 📖 US-002: Cadastro e Gestão de Projetos

## 👤 Persona & Narrativa de Usuário
> **Como** gestor ou líder técnico,  
> **Quero** cadastrar projetos definindo nome, descrição e status (ativo, pausado, concluído),  
> **Para que** a equipe possa concentrar seus esforços e alocações nas demandas corporativas prioritárias.

---

## 📝 Critérios de Aceite
- [x] O campo **Nome do Projeto** é obrigatório conforme [[02 - Regras de Negocio (RNs)#RN-03: Campo Obrigatório de Projeto|RN-03]].
- [x] O projeto possui controle de status: `ativo`, `pausado` ou `concluido`.
- [x] Campo opcional de descrição para registrar o escopo da iniciativa.
- [x] Listagem com busca em tempo real por nome ou descrição.
- [x] A exclusão do projeto remove em cascata todas as suas alocações e links associados via [[02 - Regras de Negocio (RNs)#RN-09: Exclusão em Cascata (Integridade Referencial)|RN-09]].

---

## 🛠️ Componentes & Endpoints
- **Frontend:** `src/components/ProjetosView.jsx`
- **Backend:** `GET /api/projetos`, `POST /api/projetos`, `PUT /api/projetos/:id`, `DELETE /api/projetos/:id`
