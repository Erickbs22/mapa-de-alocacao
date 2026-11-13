---
title: "US-017: Alternador para Ocultar Finais de Semana (Foco em Dias Úteis)"
tags:
  - user-story
  - gantt
  - usabilidade
  - fase-4
epic: "Linha do Tempo Avançada"
sprint: "Sprint 4.2"
priority: "Alta"
story_points: 3
status: "Pronto para Desenvolvimento"
---

# 📖 US-017: Alternador para Ocultar Finais de Semana no Gantt

## 👤 Persona & Narrativa de Usuário
> **Como** gestor de projetos de TI,  
> **Quero** poder ocultar as colunas de sábado e domingo na Linha do Tempo (Gantt),  
> **Para que** eu ganhe cerca de 28% de espaço horizontal útil e visualize 3 a 4 semanas completas de trabalho sem precisar rolar a tela lateralmente.

---

## 🎯 Contexto e Benefício
Em ambientes corporativos de desenvolvimento, as escalas padrão ocorrem de **segunda a sexta-feira**. 
- As colunas de Sábado e Domingo ocupam quase um terço da largura total da tabela.
- Ao ocultar os finais de semana, a densidade de informação útil aumenta significativamente.

---

## 📝 Critérios de Aceite

### Cenário 1: Alternador Ativo (Modo Dias Úteis)
- **Dado** que estou no Gantt e clico no botão "Ocultar Finais de Semana",
- **Quando** o filtro é aplicado,
- **Então** apenas colunas de Segunda a Sexta-feira devem ser geradas na grade,
- **E** alocações em dias úteis continuam alinhadas às suas respectivas datas,
- **E** o botão passa para o estado ativo/pressionado (ex: "Mostrar Finais de Semana").

### Cenário 2: Preservação de Alocações Excepcionais de Final de Semana
- **Dado** que exista uma alocação extraordinária cadastrada no Sábado ou Domingo,
- **Quando** o usuário oculta os finais de semana,
- **Então** o sistema pode exibir um aviso sutil ou manter um badge indicativo,
- **E** ao reativar os finais de semana, a alocação é exibida normalmente.

### Cenário 3: Compatibilidade com Drag & Drop e Preenchimento
- **Dado** que os finais de semana estão ocultos,
- **Quando** o usuário arrasta uma alocação ou puxa a alça de preenchimento (Drag-to-Fill),
- **Então** os slots continuam recebendo as alocações normalmente apenas sobre os dias visíveis na tela.

---

## 🛠️ Especificação Técnica
1. **Frontend (`src/components/GanttView.jsx`)**:
   - Adicionar estado: `const [ocultarFimDeSemana, setOcultarFimDeSemana] = useState(false);`
   - No cálculo de `listaDatas`:
     ```javascript
     const listaDatas = useMemo(() => {
       // ...
       return datasCompletas.filter(d => !ocultarFimDeSemana || !d.isFimDeSemana);
     }, [dataInicio, diasExibidos, ocultarFimDeSemana]);
     ```
2. **Estilização**:
   - Botão compacto na barra de filtros: `📅 Ocultar Finais de Semana`.
