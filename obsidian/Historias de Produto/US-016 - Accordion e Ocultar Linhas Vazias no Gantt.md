---
title: "US-016: Recolher/Expandir Projetos e Ocultar Linhas Vazias no Gantt"
tags:
  - user-story
  - gantt
  - usabilidade
  - fase-4
epic: "Linha do Tempo Avançada"
sprint: "Sprint 4.2"
priority: "Alta"
story_points: 5
status: "Pronto para Desenvolvimento"
---

# 📖 US-016: Recolher/Expandir Projetos e Ocultar Linhas Vazias no Gantt

## 👤 Persona & Narrativa de Usuário
> **Como** coordenador ou gestor de equipe técnica de software,  
> **Quero** poder recolher (colapsar) projetos e alternar a visualização para ocultar desenvolvedores sem alocação em cada projeto,  
> **Para que** eu consiga visualizar múltiplos projetos simultâneos sem poluição visual e sem rolagem vertical excessiva em equipes médias e grandes.

---

## 🎯 Contexto e Problema Atual
Atualmente, no componente `GanttView.jsx`, cada linha de projeto renderiza **todas as sublinhas de todos os programadores cadastrados** no sistema. 
- Em uma equipe com 8 projetos e 6 programadores, a tela renderiza simultaneamente 48 sublinhas.
- Isso força o gestor a rolar a página verticalmente para encontrar onde estão as alocações reais.

---

## 📝 Critérios de Aceite (Gherkin / Acceptance Criteria)

### Cenário 1: Recolher e Expandir Projeto (Accordion)
- **Dado** que estou na visualização da Linha do Tempo (Gantt),
- **Quando** clico na linha mestra de um projeto (ou no ícone de chevron `▾`),
- **Então** as sublinhas dos programadores daquele projeto devem ser recolhidas suavemente,
- **E** o ícone deve alternar para `▸`,
- **E** ao clicar novamente, as sublinhas devem ser reexpandidas.

### Cenário 2: Botões Globais "Recolher Todos" e "Expandir Todos"
- **Dado** que há múltiplos projetos exibidos na tela,
- **Quando** clico em "Recolher Todos",
- **Então** todos os projetos devem ser colapsados, exibindo apenas as barras mestras resumidas,
- **E** ao clicar em "Expandir Todos", todas as sublinhas voltam a ficar visíveis.

### Cenário 3: Alternador "Ocultar Desenvolvedores sem Alocação"
- **Dado** que a opção "Ocultar sem alocação" estiver ativada,
- **Quando** um programador não tiver nenhuma alocação registrada nas datas exibidas para aquele projeto,
- **Então** a sua sublinha não deve ser renderizada dentro daquele projeto,
- **E** apenas os programadores com esforço efetivo no período aparecem sob o projeto.

---

## ⚖️ Regras de Negócio Relacionadas
- [[02 - Regras de Negocio (RNs)#RN-05: Estrutura Matricial do Gantt|RN-05]]: A relação matricial de Projeto -> Programador -> Datas deve ser preservada intacta ao expandir/recolher.
- Persistência: O estado de expansão/recolhimento pode ser mantido em estado local ou `localStorage` para conveniência da sessão.

---

## 🛠️ Especificação Técnica de Implementação
1. **Frontend (`src/components/GanttView.jsx`)**:
   - Adicionar estado: `const [collapsedProjects, setCollapsedProjects] = useState(new Set());`
   - Adicionar toggle: `const [hideEmptyRows, setHideEmptyRows] = useState(false);`
   - Na renderização de sublinhas:
     ```jsx
     if (collapsedProjects.has(proj.id)) return null;
     ```
   - Filtrar desenvolvedores com base em:
     ```javascript
     const hasAlocInProject = alocacoes.some(a => 
       a.projeto_id === proj.id && 
       a.programador_id === prog.id && 
       listaDatas.some(d => d.iso === a.data)
     );
     ```
2. **Estilização (`src/App.css`)**:
   - Adicionar cursor pointer, hover suave e transição de recolhimento na classe `.row-project-main`.
   - Adicionar botões compactos na barra de ferramentas do Gantt.
