---
title: "US-019: Reatribuição Completa e Edição Flexível no Modal de Alocação"
tags:
  - user-story
  - alocacao
  - modal
  - usabilidade
  - fase-4
epic: "Gestão de Alocações"
sprint: "Sprint 4.1"
priority: "Crítica"
story_points: 2
status: "Pronto para Desenvolvimento"
---

# 📖 US-019: Reatribuição Completa e Edição Flexível no Modal de Alocação

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de projetos ou líder de desenvolvimento,  
> **Quero** poder alterar o desenvolvedor responsável, o projeto de destino e a data de uma alocação existente diretamente pelo Modal de Edição,  
> **Para que** eu consiga reatribuir tarefas ou corrigir agendamentos rapidamente sem ser obrigado a excluir a alocação e cadastrá-la do zero.

---

## 🎯 Contexto e Problema Atual
Em `src/components/AlocacaoModal.jsx`, os selects de **Projeto**, **Programador** e o input de **Data** possuem o atributo `disabled={isEditing}`.
Isso impede o gestor de:
1. Trocar o programador da alocação se outro colega assumir a tarefa.
2. Trocar o projeto caso a dedicação tenha sido lançada no projeto errado.
3. Trocar a data manualmente pelo campo de calendário caso não queira usar drag & drop.

O backend em `server/index.js` no endpoint `PUT /api/alocacoes/:id` **já está preparado** para receber `programador_id`, `projeto_id` e `data`. Portanto, trata-se de desbloquear e sincronizar a interface.

---

## 📝 Critérios de Aceite

### Cenário 1: Reatribuição de Programador
- **Dado** que clico em uma alocação existente para editar,
- **Quando** seleciono outro programador no dropdown do modal e clico em "Atualizar Alocação",
- **Então** o registro deve ser atualizado no banco de dados com o novo `programador_id`,
- **E** a alocação passa a ser exibida na sublinha e na cor do novo desenvolvedor.

### Cenário 2: Transferência de Projeto
- **Dado** que uma alocação pertence ao Projeto A,
- **Quando** o gestor altera o select para o Projeto B e salva,
- **Então** a alocação é transferida imediatamente para as linhas do Projeto B.

### Cenário 3: Alteração de Data via Modal
- **Dado** que a alocação estava agendada para 2026-10-27,
- **Quando** o usuário altera a data para 2026-10-28 no campo de data e salva,
- **Então** o bloco é movido para o dia correspondente.

### Cenário 4: Recálculo Imediato de Alerta de Sobrecarga
- **Dado** que ao trocar de desenvolvedor ou data a nova combinação exceder 8h diárias,
- **Então** o modal deve exibir em tempo real o alerta `⚠️ Alerta de Sobrecarga (RN-08)`.

---

## 🛠️ Especificação Técnica
1. **Frontend (`src/components/AlocacaoModal.jsx`)**:
   - Remover `disabled={isEditing}` das linhas:
     - Select de Projeto (`#aloc-projeto`)
     - Select de Programador (`#aloc-programador`)
     - Input de Data (`#aloc-data`)
   - Garantir que o cálculo de `horasOutrasAlocacoesNoDia` use os valores atuais dos states `programadorId` e `data`.
