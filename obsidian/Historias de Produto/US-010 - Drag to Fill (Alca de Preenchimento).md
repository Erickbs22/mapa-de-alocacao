---
title: "US-010: Alça de Preenchimento Contínuo (Drag-to-Fill estilo Excel)"
tags:
  - user-story
  - produtividade
  - gantt
  - preenchimento
  - fase-2
epic: "Produtividade Avançada"
priority: "Alta"
story_points: 5
status: "Concluído"
---

# 📖 US-010: Alça de Preenchimento Contínuo (Drag-to-Fill estilo Excel)

## 👤 Persona & Narrativa de Usuário
> **Como** planejador de sprint ou alocação,  
> **Quero** puxar um pequeno manipulador no canto inferior direito de um bloco de alocação existente e arrastar horizontalmente por vários dias,  
> **Para que** aquela dedicação seja replicada imediatamente em lote com o mesmo esforço em um único movimento de mouse.

---

## 📝 Critérios de Aceite
- [x] Cada card de alocação renderiza uma pequena alça de preenchimento (`.fill-handle`) no canto inferior direito.
- [x] Ao clicar e arrastar a alça sobre os dias vizinhos:
  1. As células cobertas exibem uma prévia translúcida (`extending-preview-block`) na cor do desenvolvedor com o texto `+8h`.
  2. Um banner flutuante no topo indica quantos dias serão preenchidos.
- [x] Ao soltar o mouse (`mouseup` global), dispara requisição em lote para `POST /api/alocacoes/lote`.
- [x] Transação atômica no backend salva os novos registros sem duplicar chaves.

---

## 🛠️ Componentes & Endpoints
- **Frontend:** `src/components/GanttView.jsx` (estados `extending`, listeners de mouse)
- **Backend:** `POST /api/alocacoes/lote` (com transação SQLite)
