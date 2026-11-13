---
title: "US-020: Gestão de Férias, Folgas e Feriados Corporativos (Ausências)"
tags:
  - user-story
  - governanca
  - ferias
  - fase-5
epic: "Governança & Disponibilidade"
sprint: "Sprint 5.1"
priority: "Alta"
story_points: 8
status: "Concluído"
---

# 📖 US-020: Gestão de Férias, Folgas e Feriados Corporativos (Ausências)

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de equipe ou coordenador de projetos,  
> **Quero** cadastrar períodos de férias, folgas e licenças para os programadores (bem como feriados corporativos),  
> **Para que** esses dias fiquem bloqueados ou visualmente destacados na Linha do Tempo e no Calendário, evitando agendamentos indevidos em datas em que o profissional estará ausente.

---

## 🎯 Contexto e Benefício
No modelo atual, todos os dias úteis aparecem como 100% disponíveis para qualquer desenvolvedor, mesmo se ele estiver de férias ou em recesso. 
Com este recurso:
- O gestor enxerga imediatamente as faixas de ausência.
- A capacidade teórica da equipe no **Dashboard** é recalculada com precisão (subtraindo os dias de férias da meta de horas).

---

## 📝 Critérios de Aceite

### Cenário 1: Cadastro de Ausência do Programador
- **Dado** que estou no perfil de um programador (ou em um modal dedicado de ausências),
- **Quando** informo o tipo (`Férias`, `Folga/Licença`, `Feriado`), data início e data fim,
- **Então** o registro é salvo na tabela `ausencias`.

### Cenário 2: Representação Visual no Gantt e Calendário
- **Dado** que o desenvolvedor possui férias no período de 01 a 15 do mês,
- **Quando** visualizo a Linha do Tempo (Gantt) ou o Calendário,
- **Então** os slots daquele desenvolvedor nessas datas devem ser preenchidos com um padrão de hachura/listras cinzas e um badge discreto `🏖️ Férias`,
- **E** o slot vazio não deve convidar alocação normal.

### Cenário 3: Alerta Preventivo de Tentativa de Alocação
- **Dado** que tento criar uma alocação para um dev que está de férias,
- **Quando** seleciono aquela data no modal,
- **Então** o sistema exibe um aviso: `⚠️ Atenção: Carlos Silva está em período de férias nesta data.`

### Cenário 4: Dedução da Capacidade no Dashboard
- **Dado** que um dev possui 10 dias de férias no mês (80h),
- **Quando** o Dashboard calcula a `capacidadeMaximaEquipe`,
- **Então** essas 80h são abatidas do total disponível, refletindo a taxa real de ocupação da equipe.

---

## 🛠️ Especificação Técnica
1. **Banco de Dados SQLite (`server/db.js`)**:
   ```sql
   CREATE TABLE IF NOT EXISTS ausencias (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     programador_id INTEGER, -- NULL se for feriado corporativo global
     tipo TEXT NOT NULL, -- 'ferias', 'folga', 'licenca', 'feriado'
     data_inicio TEXT NOT NULL,
     data_fim TEXT NOT NULL,
     descricao TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (programador_id) REFERENCES programadores(id) ON DELETE CASCADE
   );
   ```
2. **Endpoints Backend (`server/index.js`)**:
   - `GET /api/ausencias`
   - `POST /api/ausencias`
   - `DELETE /api/ausencias/:id`
