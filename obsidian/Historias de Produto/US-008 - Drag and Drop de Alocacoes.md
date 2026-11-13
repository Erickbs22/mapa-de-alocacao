---
title: "US-008: Drag & Drop de Alocações no Gantt e no Calendário"
tags:
  - user-story
  - drag-and-drop
  - interatividade
  - fase-2
epic: "Interatividade & Agilidade"
priority: "Alta"
story_points: 5
status: "Concluído"
---

# 📖 US-008: Drag & Drop de Alocações no Gantt e no Calendário

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de projetos dinâmicos,  
> **Quero** poder clicar e arrastar qualquer bloco de alocação de um dia para outro (ou de um dev para outro no Gantt),  
> **Para que** eu faça ajustes finos e remanejamentos com velocidade máxima sem ter que abrir modais manuais.

---

## 📝 Critérios de Aceite
- [x] O bloco de alocação possui atributo `draggable` nativo (sem bibliotecas externas pesadas).
- [x] Drag handle visual (`⋮⋮`) orientando o usuário sobre a área de arraste.
- [x] Célula de destino destaca-se com borda tracejada e cor de fundo receptiva ao passar o mouse (`dragover`).
- [x] Ao soltar o mouse (`drop`), o sistema atualiza a alocação via `PUT /api/alocacoes/:id` e exibe feedback flutuante (toast) confirmando o movimento.
- [x] No Calendário, arrastar um card para outro dia atualiza a data da alocação instantaneamente.

---

## 🛠️ Componentes
- **Frontend:** `src/components/GanttView.jsx`, `src/components/CalendarioView.jsx`
- **Backend:** `PUT /api/alocacoes/:id`
