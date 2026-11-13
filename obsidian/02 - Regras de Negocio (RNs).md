---
title: "Matriz de Regras de Negócio (RNs)"
tags:
  - regras-de-negocio
  - governanca
  - requisitos
updated: 2026-10-27
status: ativo
---

# ⚖️ 02 - Matriz de Regras de Negócio (RNs)

Este documento compila todas as **Regras de Negócio (RN)** que regem o comportamento funcional, as validações de dados e a integridade do sistema **Controle Mapa de Alocação**.

---

## 📋 Tabela Resumo das Regras

| Código | Nome da Regra | Módulo Principal | Severidade |
| :--- | :--- | :--- | :---: |
| **RN-01** | Unicidade de Identificação Visual | Programadores | `Informativa / Sugestiva` |
| **RN-02** | Campo Obrigatório de Programador | Programadores | `Bloqueante` |
| **RN-03** | Campo Obrigatório de Projeto | Projetos | `Bloqueante` |
| **RN-04** | Formato de Links Externos | Projetos & Links | `Validatória` |
| **RN-05** | Estrutura Matricial do Gantt | Linha do Tempo | `Arquitetural` |
| **RN-06** | Distribuição Mensal no Calendário | Calendário | `Arquitetural` |
| **RN-07** | Padrão de Jornada Diária (8 Horas) | Alocações | `Padrão de Sistema` |
| **RN-08** | Limite de Jornada e Detecção de Sobrecarga | Alocações / Governança | `Alerta Visual` |
| **RN-09** | Exclusão em Cascata (Integridade Referencial) | Banco de Dados | `Bloqueante` |
| **RN-10** | Prevenção de Conflito em Períodos | Alocações em Lote | `Configurável` |
| **RN-11** | Compatibilidade de Exportação CSV | Relatórios | `Compatibilidade` |
| **RN-12** | Integridade Estrutural de Backups | Confiabilidade | `Bloqueante` |

---

## 🔍 Detalhamento das Regras

### RN-01: Unicidade de Identificação Visual
- **Descrição:** Cada programador deve preferencialmente possuir uma cor visual exclusiva atribuída para facilitar a identificação rápida no Gantt e no Calendário.
- **Implementação:** O sistema sugere automaticamente a próxima cor livre da paleta padrão (`/api/cores-disponiveis`). Cores em uso por outros colegas exibem aviso visual, mas o usuário pode optar por repetir cores ou informar um código HEX customizado caso a equipe ultrapasse 12 membros.

### RN-02: Campo Obrigatório de Programador
- **Descrição:** O **Nome** é o único campo estritamente obrigatório no cadastro de programadores.
- **Validação:** Não é permitido salvar programador com nome vazio ou apenas espaços em branco. E-mail e tecnologias são opcionais.

### RN-03: Campo Obrigatório de Projeto
- **Descrição:** O **Nome do Projeto** é obrigatório para criação e edição. Descrição e links são opcionais.

### RN-04: Formato de Links Externos
- **Descrição:** Links associados a projetos devem conter uma URL válida. Se o rótulo for omitido, o sistema adotará `"Link do Projeto"` por padrão. Devem ser abertos em nova aba com `rel="noopener noreferrer"`.

### RN-05: Estrutura Matricial do Gantt
- **Descrição:** A Linha do Tempo deve ser estruturada matricialmente:
  - **Linhas Mestras:** Projetos.
  - **Sublinhas:** Programadores pertencentes ao projeto ou disponíveis para alocação.
  - **Colunas:** Dias cronológicos sequenciais.

### RN-06: Distribuição Mensal no Calendário
- **Descrição:** O calendário deve renderizar a grade mensal completa iniciando no Domingo e finalizando no Sábado, preenchendo os dias residuais do mês anterior e posterior para manter as semanas alinhadas.

### RN-07: Padrão de Jornada Diária (8 Horas)
- **Descrição:** Toda nova alocação é inicializada por padrão como **Dia Todo (8.0 horas)**. Caso o usuário desmarque essa opção, deve informar a fração de horas (ex: 4h, 2h).

### RN-08: Limite de Jornada e Detecção de Sobrecarga
- **Descrição:** Um desenvolvedor não deve exceder 8 horas normais de dedicação diária acumulada somando todos os projetos em que estiver alocado no mesmo dia.
- **Comportamento:** O sistema não bloqueia rigidamente a alocação (para permitir horas extras ou transições reais de projetos), mas aplica:
  1. Borda pulsante vermelha (`#EF4444`) no bloco da alocação no Gantt.
  2. Ícone de alerta `⚠️` com tooltip detalhando as horas acumuladas.
  3. Alerta preventivo no formulário do modal.
  4. Contabilização no card de "Casos de Sobrecarga" do Dashboard.

### RN-09: Exclusão em Cascata (Integridade Referencial)
- **Descrição:** Ao excluir um programador ou um projeto, todas as alocações e vínculos associados devem ser excluídos automaticamente via `ON DELETE CASCADE` do banco de dados SQLite para evitar registros órfãos.

### RN-10: Prevenção de Conflito em Períodos
- **Descrição:** Ao alocar um programador para um período de datas em lote (`/api/alocacoes/periodo`), o usuário deve poder escolher entre:
  - **Somar dedicação:** Mantém alocações em outros projetos e soma as horas (emitindo alerta caso supere 8h).
  - **Substituir tudo:** Remove alocações anteriores do programador naquelas datas e registra o novo projeto de forma exclusiva.

### RN-11: Compatibilidade de Exportação CSV
- **Descrição:** O arquivo CSV exportado deve conter o prefixo UTF-8 Byte Order Mark (`\uFEFF`) e delimitador ponto-e-vírgula (`;`), garantindo que acentuações e caracteres da língua portuguesa abram perfeitamente no Microsoft Excel sem corrupção de caracteres.

### RN-12: Integridade Estrutural de Backups
- **Descrição:** A importação de backup em JSON deve validar antes da execução se os arrays de `programadores` e `projetos` existem no payload. A substituição dos dados deve ocorrer dentro de uma transação atômica (`BEGIN TRANSACTION ... COMMIT`), garantindo rollback imediato se ocorrer qualquer falha durante a carga.
