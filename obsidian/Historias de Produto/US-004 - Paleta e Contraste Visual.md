---
title: "US-004: Paleta Inteligente e Contraste Visual de Cores"
tags:
  - user-story
  - design
  - contraste
  - ux
  - fase-1
epic: "UX & Identidade Visual"
priority: "Alta"
story_points: 2
status: "Concluído"
---

# 📖 US-004: Paleta Inteligente e Contraste Visual de Cores

## 👤 Persona & Narrativa de Usuário
> **Como** usuário do sistema visual de alocação,  
> **Quero** que cada programador receba automaticamente uma cor distinta com cálculo de contraste para o texto,  
> **Para que** a visualização no Gantt e no Calendário seja instantaneamente legível e acessível sem esforço cognitivo.

---

## 📝 Critérios de Aceite
- [x] O sistema fornece uma paleta com 12 cores contrastantes e harmoniosas.
- [x] Endpoint `/api/cores-disponiveis` detecta quais cores já estão em uso e sugere automaticamente a próxima livre.
- [x] Algoritmo YIQ calcula dinamicamente se o texto sobre a cor deve ser branco (`#FFFFFF`) ou preto carvão (`#111827`).
- [x] Possibilidade de informar uma cor HEX personalizada via `input[type="color"]`.

---

## 🛠️ Componentes & Funções
- **Função YIQ:** `getContrastColor(hexColor)` em `GanttView.jsx` e `ProgramadoresView.jsx`.
- **Backend:** `server/db.js` (constante `PALETA_CORES`), `server/index.js` (`GET /api/cores-disponiveis`).
