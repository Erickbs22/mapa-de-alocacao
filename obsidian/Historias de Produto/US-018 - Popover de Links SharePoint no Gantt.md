---
title: "US-018: Acesso Rápido aos Links do SharePoint e Repositórios no Gantt"
tags:
  - user-story
  - gantt
  - sharepoint
  - usabilidade
  - fase-4
epic: "Linha do Tempo Avançada"
sprint: "Sprint 4.1"
priority: "Alta"
story_points: 3
status: "Pronto para Desenvolvimento"
---

# 📖 US-018: Acesso Rápido aos Links do SharePoint e Repositórios no Gantt

## 👤 Persona & Narrativa de Usuário
> **Como** gestor ou desenvolvedor da equipe técnica,  
> **Quero** poder clicar no selo de links ao lado do nome do projeto na Linha do Tempo e ver um menu popover com os links diretos para a pasta do SharePoint, Jira ou GitHub,  
> **Para que** eu acerte e abra a documentação do projeto em 1 clique sem precisar sair da visão da Linha do Tempo e navegar até a aba "Projetos".

---

## 🎯 Contexto e Problema Atual
No cabeçalho do projeto dentro de `GanttView.jsx`, já existe o seguinte elemento:
```jsx
<span className="links-count-pill" title={`${proj.links.length} link(s) associado(s)`}>
  🔗 {proj.links.length}
</span>
```
No entanto, esse elemento é puramente estático. O usuário vê que existem 2 ou 3 links, mas não consegue clicar para acessá-los diretamente.

---

## 📝 Critérios de Aceite

### Cenário 1: Exibição do Menu Flutuante (Popover)
- **Dado** que um projeto possui links cadastrados (ex: Pasta SharePoint, Repositório Git),
- **Quando** clico sobre o selo `🔗 N` na linha do projeto no Gantt,
- **Então** abre-se um pequeno menu popover suspenso com a lista dos links disponíveis,
- **E** cada item exibe o ícone, o rótulo amigável (ex: "Pasta SharePoint") e a seta de link externo `↗`.

### Cenário 2: Navegação Segura
- **Dado** que o popover está aberto,
- **Quando** clico em qualquer um dos links,
- **Então** o link deve ser aberto em uma **nova aba** (`target="_blank"`) com proteção `rel="noopener noreferrer"`,
- **E** o popover se fecha ou permanece disponível.

### Cenário 3: Fechamento Intuitivo
- **Dado** que o popover de links está aberto,
- **Quando** clico fora do menu ou aperto a tecla `Esc`,
- **Então** o popover é fechado imediatamente.

---

## 🛠️ Especificação Técnica
1. **Frontend (`src/components/GanttView.jsx`)**:
   - Adicionar estado: `const [activeLinksPopoverProjId, setActiveLinksPopoverProjId] = useState(null);`
   - Renderizar o popover com posicionamento absoluto no container relativo do projeto.
2. **Estilização (`src/App.css`)**:
   - Classe `.links-popover-menu` com background `var(--bg-card)`, borda `var(--border-medium)`, sombra elevada `var(--shadow-lg)` e efeito glassmorphism.
