---
title: "US-012: Dashboard Executivo com KPIs e Gráficos de Capacidade"
tags:
  - user-story
  - dashboard
  - bi
  - metricas
  - fase-3
epic: "Gestão & BI"
priority: "Alta"
story_points: 5
status: "Concluído"
---

# 📖 US-012: Dashboard Executivo com KPIs e Gráficos de Capacidade

## 👤 Persona & Narrativa de Usuário
> **Como** gerente de engenharia ou diretor de operações,  
> **Quero** acessar um painel analítico com indicadores de capacidade total, taxa de ocupação da equipe e distribuição percentual de horas por projeto,  
> **Para que** eu tome decisões estratégicas baseadas em dados sobre contratações, realocação de recursos e priorização de projetos.

---

## 📝 Critérios de Aceite
- [x] Filtro de período pré-configurado: Mês Atual, Próximo Mês, Próximos 30 dias, Últimos 30 dias, Todo o Histórico e Personalizado.
- [x] 4 Cards de KPIs em tempo real:
  1. **Horas Alocadas** no período selecionado.
  2. **Taxa de Ocupação da Equipe** (%) calculada sobre `diasUteis * 8h * totalDevs`.
  3. **Projetos com Demanda** em relação ao total de projetos cadastrados.
  4. **Casos de Sobrecarga** detectados.
- [x] Painel de **Distribuição de Esforço por Projeto** com barras de progresso percentuais e contagem de devs participantes.
- [x] Painel de **Dedicação e Capacidade por Desenvolvedor** com badge de status de carga (`Equilibrado`, `Sobrecarga`, `Disponível`, `Sem Alocação`).

---

## 🛠️ Componentes
- **Frontend:** `src/components/DashboardView.jsx`
