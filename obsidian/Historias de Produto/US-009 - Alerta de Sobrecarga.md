---
title: "US-009: Detecção e Alerta Visual de Sobrecargas (> 8h no dia)"
tags:
  - user-story
  - governanca
  - sobrecarga
  - fase-2
epic: "Governança & Disponibilidade"
priority: "Crítica"
story_points: 3
status: "Concluído"
---

# 📖 US-009: Detecção e Alerta Visual de Sobrecargas (> 8h no dia)

## 👤 Persona & Narrativa de Usuário
> **Como** gestor responsável pela saúde e produtividade da equipe,  
> **Quero** que o sistema me alerte visualmente sempre que a soma das horas de um desenvolvedor ultrapassar 8h em um mesmo dia,  
> **Para que** eu evite sobrecarga de trabalho, conflitos de prioridade e atrasos em entregas simultâneas.

---

## 📝 Critérios de Aceite
- [x] Detecção automática calculando a soma de horas de todas as alocações do desenvolvedor na mesma data ([[02 - Regras de Negocio (RNs)#RN-08: Limite de Jornada e Detecção de Sobrecarga|RN-08]]).
- [x] Se `totalHorasDia > 8`:
  1. O bloco no Gantt recebe destaque com borda vermelha (`0 0 0 2px #EF4444`).
  2. Ícone de alerta `⚠️` visível com tooltip especificando as horas totais alocadas.
  3. No modal de criação/edição, aviso preventivo em amarelo/vermelho indicando as horas já comprometidas.
  4. No Dashboard, card de KPI dedicando contagem de casos de sobrecarga e lista discriminada de desenvolvedores em conflito.

---

## 🛠️ Componentes
- **Frontend:** `src/components/GanttView.jsx`, `src/components/AlocacaoModal.jsx`, `src/components/DashboardView.jsx`
