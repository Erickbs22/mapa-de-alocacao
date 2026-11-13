---
title: "US-005: Linha do Tempo Matricial (Gantt)"
tags:
  - user-story
  - gantt
  - linha-do-tempo
  - fase-2
epic: "Alocação Visual"
priority: "Crítica"
story_points: 8
status: "Concluído"
---

# 📖 US-005: Linha do Tempo Matricial (Gantt)

## 👤 Persona & Narrativa de Usuário
> **Como** gestor ou planejador de capacidade de TI,  
> **Quero** visualizar a Linha do Tempo em uma matriz de Projetos (linhas mestras), Programadores (sublinhas) e Datas (colunas),  
> **Para que** eu identifique rapidamente a alocação de esforço em múltiplos projetos simultâneos.

---

## 📝 Critérios de Aceite
- [x] Estrutura matricial completa conforme [[02 - Regras de Negocio (RNs)#RN-05: Estrutura Matricial do Gantt|RN-05]].
- [x] Controles de navegação temporal: avançar/retroceder semana, botão "Hoje" e seletor de horizonte temporal (7, 14, 21 ou 30 dias).
- [x] Finais de semana sinalizados com estilização diferenciada (`col-weekend` e `cell-weekend`).
- [x] Filtros dinâmicos rápidos por projeto específico ou por programador específico.
- [x] Slot vazio com botão `+` que abre criação imediata pré-preenchida com o projeto, dev e data da célula.

---

## 🛠️ Componentes
- **Frontend:** `src/components/GanttView.jsx`
- **Backend:** `GET /api/alocacoes`
