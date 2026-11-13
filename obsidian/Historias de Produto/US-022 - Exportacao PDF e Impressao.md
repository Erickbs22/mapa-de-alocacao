---
title: "US-022: Exportação Executiva e Impressão para PDF"
tags:
  - user-story
  - relatorios
  - pdf
  - fase-6
epic: "Relatórios & Governança"
sprint: "Sprint 6.1"
priority: "Média"
story_points: 5
status: "Concluído"
---

# 📖 US-022: Exportação Executiva e Impressão para PDF

## 👤 Persona & Narrativa de Usuário
> **Como** coordenador ou gerente de tecnologia,  
> **Quero** imprimir ou salvar em formato PDF a Linha do Tempo (Gantt) e o Dashboard de Indicadores em um layout limpo e formatado para papel A4 paisagem,  
> **Para que** eu possa anexar relatórios em apresentações para diretoria ou levar o mapa impresso para reuniões de planejamento de sprint e capacidade.

---

## 📝 Critérios de Aceite

### Cenário 1: Disparo da Impressão / Salvar PDF
- **Dado** que estou no Gantt ou no Dashboard,
- **Quando** clico no botão "Imprimir / Exportar PDF",
- **Então** o diálogo nativo de impressão do navegador é disparado (`window.print()`).

### Cenário 2: Otimização de Layout para Impressão (`@media print`)
- **Dado** que a visualização de impressão foi acionada,
- **Então** os elementos interativos como barra de navegação, botões de ação, inputs de busca e drag-handles devem ser ocultados,
- **E** a tabela deve adotar orientações em modo Paisagem (Landscape),
- **E** o fundo deve ser convertido para alto contraste com fundo branco para economizar tinta.
