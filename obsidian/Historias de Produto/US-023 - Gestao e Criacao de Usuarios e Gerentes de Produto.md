---
title: "US-023: Gestão e Criação de Usuários e Gerentes de Produto"
tags:
  - user-story
  - usuarios
  - autenticacao
  - gerentes
  - portfolios
  - seguranca
epic: "Governança e Controle de Acesso"
priority: "Crítica"
story_points: 5
status: "Concluído"
---

# 📖 US-023: Gestão e Criação de Usuários e Gerentes de Produto

## 👤 Persona & Narrativa de Usuário
> **Como** administrador do sistema de alocação,  
> **Quero** criar, listar, filtrar, editar e desativar/excluir usuários (Administradores e Gerentes de Produto vinculados a portfólios),  
> **Para que** novos gestores possam acessar o sistema com credenciais próprias e governança estrita do seu escopo de projetos.

---

## 📝 Critérios de Aceite
- [x] **Aba Principal Dedicada:** Nova aba "Usuários" acessível via navbar para administradores do sistema.
- [x] **Modal Completo de Cadastro/Edição (`UsuarioModal.jsx`):**
  - Nome completo (obrigatório).
  - E-mail corporativo (obrigatório, formato válido e verificação de duplicidade).
  - Seleção de Perfil: Administrador (acesso global a todos os portfólios) ou Gerente de Produto (vinculado a um portfólio específico).
  - Seleção de Portfólio obrigatória para o perfil Gerente de Produto.
  - Senha com confirmação e mínimo de 6 caracteres na criação (opcional na edição caso deseje manter a senha atual).
  - Status Ativo / Inativo.
- [x] **Segurança e Criptografia:**
  - Senhas armazenadas com hash forte (`crypto.scryptSync`) e salt criptográfico.
  - Autenticação e emissão de tokens de sessão HMAC-SHA256 (`/api/auth/login` e `/api/auth/me`).
  - Proteção contra auto-exclusão e contra exclusão do único administrador ativo.
- [x] **Visualização e Filtros Avançados (`UsuariosView.jsx`):**
  - Busca instantânea por nome, e-mail e nome do portfólio.
  - Filtros rápidos por perfil (Todos, Admins, Gerentes PM).
  - Filtros por status (Ativos, Inativos) e filtro dropdown por Portfólio.
  - Ações diretas nos cards: Editar e Excluir com confirmação.
- [x] **Botão de Acesso Rápido na Navbar:**
  - Botão `👤+ Novo Usuário` disponível no cabeçalho para administradores.

---

## 🛠️ Componentes & Endpoints
- **Frontend:**
  - `src/components/UsuariosView.jsx` (Listagem, grid de cards e filtros)
  - `src/components/UsuarioModal.jsx` (Modal com formulário e validações)
  - `src/components/Navbar.jsx` (Aba "Usuários" e botão "+ Novo Usuário")
  - `src/App.jsx` (Orquestração de estados, login e CRUD)
- **Backend:**
  - `POST /api/auth/login` (Autenticação corporativa)
  - `GET /api/auth/me` (Validação de token da sessão)
  - `GET /api/usuarios` (Listagem de usuários)
  - `POST /api/usuarios` (Criação com hash de senha)
  - `PUT /api/usuarios/:id` (Edição com validação)
  - `DELETE /api/usuarios/:id` (Exclusão segura)

