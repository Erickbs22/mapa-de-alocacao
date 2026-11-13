---
title: "US-013: Exportação de Dados em CSV Compatível com Excel"
tags:
  - user-story
  - relatorios
  - exportacao
  - csv
  - excel
  - fase-3
epic: "Exportação & Relatórios"
priority: "Média"
story_points: 2
status: "Concluído"
---

# 📖 US-013: Exportação de Dados em CSV Compatível com Excel

## 👤 Persona & Narrativa de Usuário
> **Como** coordenador ou analista de PMO,  
> **Quero** exportar as alocações do período filtrado para um arquivo CSV compatível com o Microsoft Excel,  
> **Para que** eu possa criar tabelas dinâmicas, gráficos customizados e relatórios de auditoria financeira das horas trabalhadas.

---

## 📝 Critérios de Aceite
- [x] O botão "Exportar CSV (Excel)" no Dashboard exporta as alocações pertencentes ao período ativo.
- [x] Formatação compatível com Excel brasileiro utilizando delimitador ponto-e-vírgula (`;`) e prefixo UTF-8 BOM (`\uFEFF`) conforme [[02 - Regras de Negocio (RNs)#RN-11: Compatibilidade de Exportação CSV|RN-11]].
- [x] Colunas exportadas: Data, Dia da Semana, Programador, E-mail, Projeto, Status do Projeto, Horas Alocadas, Tipo (Integral/Parcial), Observações.
- [x] Nome automático do arquivo com as datas inicial e final: `relatorio_alocacao_YYYY-MM-DD_a_YYYY-MM-DD.csv`.

---

## 🛠️ Componentes
- **Frontend:** `src/components/DashboardView.jsx` (função `handleExportCSV`)
