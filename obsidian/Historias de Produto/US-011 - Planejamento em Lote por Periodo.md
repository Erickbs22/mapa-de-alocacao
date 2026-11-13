---
title: "US-011: Planejamento em Lote por Período e Dias Úteis"
tags:
  - user-story
  - produtividade
  - lote
  - periodo
  - fase-2
epic: "Produtividade Avançada"
priority: "Alta"
story_points: 5
status: "Concluído"
---

# 📖 US-011: Planejamento em Lote por Período e Dias Úteis

## 👤 Persona & Narrativa de Usuário
> **Como** gestor atribuindo um desenvolvedor a um projeto de longa duração (ex: 3 meses),  
> **Quero** informar data de início e fim com a opção de alocar apenas em dias úteis e escolher a resolução de conflitos,  
> **Para que** centenas de dias de alocação sejam agendados com precisão em segundos sem gerar esforço em finais de semana.

---

## 📝 Critérios de Aceite
- [x] Modal dedicado de planejamento acessado diretamente pelo card do desenvolvedor em `ProgramadoresView`.
- [x] Seleção de Projeto, Data Inicial e Data Final.
- [x] Checkbox "Apenas dias úteis (Segunda a Sexta-feira)" ativado por padrão.
- [x] Tratamento de conflito configurável conforme [[02 - Regras de Negocio (RNs)#RN-10: Prevenção de Conflito em Períodos|RN-10]] (`Somar dedicação` ou `Substituir alocações anteriores`).
- [x] Painel de simulação em tempo real exibindo a quantidade de dias úteis elegíveis, o total de horas calculadas e alertas de sobrecarga previstos antes da submissão.
- [x] Coluna lateral com a agenda completa e alocações ativas do desenvolvedor para conferência.

---

## 🛠️ Componentes & Endpoints
- **Frontend:** `src/components/PlanejarAlocacoesModal.jsx`
- **Backend:** `POST /api/alocacoes/periodo` (com transação atômica SQLite)
