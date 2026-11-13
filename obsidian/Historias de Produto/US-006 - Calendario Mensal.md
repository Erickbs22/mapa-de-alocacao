---
title: "US-006: Calendário Mensal Interativo"
tags:
  - user-story
  - calendario
  - mensal
  - fase-2
epic: "Alocação Visual"
priority: "Alta"
story_points: 5
status: "Concluído"
---

# 📖 US-006: Calendário Mensal Interativo

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de projetos ou desenvolvedor,  
> **Quero** visualizar a dedicação da equipe em formato de grade de calendário mensal,  
> **Para que** eu acompanhe compromissos e entregas em visão de mês tradicional.

---

## 📝 Critérios de Aceite
- [x] Grade mensal completa iniciando no Domingo e finalizando no Sábado ([[02 - Regras de Negocio (RNs)#RN-06: Distribuição Mensal no Calendário|RN-06]]).
- [x] Preenchimento dos dias residuais do mês anterior e posterior para alinhamento da grade.
- [x] Navegação por mês anterior, próximo mês e botão rápido "Mês Atual".
- [x] Indicador do dia atual com badge destacado (`hoje-badge`).
- [x] Cards dos eventos exibindo o primeiro nome do programador, horas alocadas e borda na cor do desenvolvedor.
- [x] Botão de adição rápida `+` no cabeçalho de cada dia.

---

## 🛠️ Componentes
- **Frontend:** `src/components/CalendarioView.jsx`
- **Backend:** `GET /api/alocacoes`
