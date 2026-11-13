---
title: "US-001: Cadastro e Gestão de Programadores"
tags:
  - user-story
  - programadores
  - cadastros
  - fase-1
epic: "Cadastros Base"
priority: "Crítica"
story_points: 3
status: "Concluído"
---

# 📖 US-001: Cadastro e Gestão de Programadores

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de equipe de desenvolvimento,  
> **Quero** cadastrar, listar, editar e excluir os programadores da equipe,  
> **Para que** eles possam ser selecionados e alocados nos projetos com suas respectivas tecnologias e identidades visuais.

---

## 📝 Critérios de Aceite
- [x] O campo **Nome** é obrigatório conforme [[02 - Regras de Negocio (RNs)#RN-02: Campo Obrigatório de Programador|RN-02]].
- [x] Campos de **E-mail** e **Tecnologias** são opcionais.
- [x] A listagem permite busca em tempo real por nome, tecnologia ou e-mail.
- [x] A exclusão do programador remove suas alocações em cascata via [[02 - Regras de Negocio (RNs)#RN-09: Exclusão em Cascata (Integridade Referencial)|RN-09]].
- [x] Cada card exibe avatar dinâmico com iniciais do nome e tag com o código HEX da cor.

---

## 🛠️ Componentes & Endpoints
- **Frontend:** `src/components/ProgramadoresView.jsx`
- **Backend:** `GET /api/programadores`, `POST /api/programadores`, `PUT /api/programadores/:id`, `DELETE /api/programadores/:id`
