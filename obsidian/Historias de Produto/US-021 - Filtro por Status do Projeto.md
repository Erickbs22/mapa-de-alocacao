---
title: "US-021: Filtro e Arquivamento de Projetos por Status (Ativo, Pausado, Concluído)"
tags:
  - user-story
  - projetos
  - filtros
  - fase-5
epic: "Gestão de Projetos"
sprint: "Sprint 5.1"
priority: "Média"
story_points: 3
status: "Backlog"
---

# 📖 US-021: Filtro e Arquivamento de Projetos por Status

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de alocação de equipes,  
> **Quero** poder filtrar projetos por status nas visões de Gantt e Calendário (com padrão exibindo apenas os projetos `ativos`),  
> **Para que** projetos já concluídos ou pausados não ocupem espaço visual inútil no meu dia a dia de planejamento.

---

## 📝 Critérios de Aceite

### Cenário 1: Comportamento Padrão da Linha do Tempo
- **Dado** que entro na Linha do Tempo (Gantt),
- **Então** por padrão apenas projetos com status `ativo` devem ser listados.

### Cenário 2: Alternância de Filtro de Status
- **Dado** que desejo consultar o histórico de um projeto encerrado,
- **Quando** mudo o filtro de status para "Concluídos" ou "Todos os Status",
- **Então** o Gantt passa a exibir os projetos correspondentes e suas alocações passadas.

### Cenário 3: Exibição no Dropdown de Seleção de Projetos
- **Dado** que estou no modal criando uma nova alocação,
- **Quando** abro a lista de projetos,
- **Então** projetos pausados ou concluídos devem aparecer agrupados ou com indicação clara `(Pausado)` / `(Concluído)` para evitar erros de lançamento.
