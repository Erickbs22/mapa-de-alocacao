---
title: "US-015: Alternância de Modo Claro e Escuro com Persistência"
tags:
  - user-story
  - temas
  - dark-mode
  - design
  - fase-3
epic: "UX & Identidade Visual"
priority: "Média"
story_points: 2
status: "Concluído"
---

# 📖 US-015: Alternância de Modo Claro e Escuro com Persistência

## 👤 Persona & Narrativa de Usuário
> **Como** usuário que passa várias horas no mapa de alocação em diferentes ambientes de iluminação,  
> **Quero** poder alternar entre o Modo Escuro e o Modo Claro a qualquer momento, mantendo minha escolha salva no navegador,  
> **Para que** eu tenha conforto visual de acordo com a minha preferência pessoal e horário de trabalho.

---

## 📝 Critérios de Aceite
- [x] O sistema detecta a preferência do sistema operacional (`prefers-color-scheme`) como fallback inicial.
- [x] Botão na Navbar permite alternar entre `☀️ Modo Claro` e `🌙 Modo Escuro`.
- [x] O tema escolhido é salvo no `localStorage` sob a chave `app-theme` e restaurado ao recarregar a página.
- [x] Ambas as paletas utilizam tokens semânticos completos no CSS (`--bg-app`, `--text-primary`, `--border-subtle`, etc.) com contraste validado para WCAG.

---

## 🛠️ Componentes & Estilos
- **Frontend:** `src/App.jsx` (estado `theme`), `src/components/Navbar.jsx`
- **Design Tokens:** `src/index.css` (`:root, [data-theme="dark"]` e `[data-theme="light"]`)
