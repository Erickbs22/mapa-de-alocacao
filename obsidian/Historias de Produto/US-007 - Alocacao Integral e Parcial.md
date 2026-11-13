---
title: "US-007: Alocação Integral (8h) e Dedicação Parcial"
tags:
  - user-story
  - alocacao
  - horas
  - fase-2
epic: "Gestão de Alocações"
priority: "Crítica"
story_points: 3
status: "Concluído"
---

# 📖 US-007: Alocação Integral (8h) e Dedicação Parcial

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de projetos,  
> **Quero** poder alocar um desenvolvedor para o dia todo (8h) ou informar uma quantidade de horas fracionadas (ex: 4h em sustentação e 4h em novo projeto),  
> **Para que** eu consiga refletir com precisão a divisão de esforço entre múltiplos projetos no mesmo dia.

---

## 📝 Critérios de Aceite
- [x] O checkbox "Alocação Integral (Dia Todo)" vem marcado por padrão atribuindo 8.0 horas ([[02 - Regras de Negocio (RNs)#RN-07: Padrão de Jornada Diária (8 Horas)|RN-07]]).
- [x] Ao desmarcar o dia todo, é exibido campo numérico de horas (com suporte a decimais, ex: 0.5h, 4.0h).
- [x] Campo para observações e notas da tarefa (ex: "Foco no módulo financeiro").
- [x] Validação impedindo alocações com horas zeradas ou negativas.

---

## 🛠️ Componentes
- **Frontend:** `src/components/AlocacaoModal.jsx`
- **Backend:** `POST /api/alocacoes`, `PUT /api/alocacoes/:id`
