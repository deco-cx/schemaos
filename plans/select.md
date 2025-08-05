📄 Relatório técnico – Seleção de nodes para executar Ações de IA  
(repositório ordenado, Agosto 2025)

────────────────────────────────────────
1. Visão geral da feature
────────────────────────────────────────
• Permite escolher vários nodes (ferramentas ou blocos de código) num canvas React-Flow e disparar ações de IA sobre o subconjunto selecionado.  
• Dois modos de IA disponíveis hoje:  
  1. “Edit with AI” – o assistente sugere edições/otimizações nesses nodes.  
  2. “Agent with these tools” – o agente encadeia e executa os nodes para cumprir uma tarefa.  
• A seleção é persistida num store global (Zustand) e, portanto, acessível por qualquer componente (menus, modais, back-end).

────────────────────────────────────────
2. Gerenciamento de estado
────────────────────────────────────────
Arquivo-chave: `view/src/store.ts` (linhas 625-674).

UI store dedicado a seleção e chat:  
```typescript
selectedNodeIds: new Set<string>();      // conjunto de IDs selecionados
toggleNodeSelection(id)                  // adiciona/remove da seleção
selectNodes(ids[])                       // seleciona lista (box-select)
clearSelection()                         // limpa tudo
openAgentChat(mode) / closeAgentChat()   // controla modal de IA
```

Motivos para usar `Set`:
• Look-ups O(1) dentro de cada Node para renderizar highlight.  
• Evita duplicatas.  
• A serialização (ex.: salvar estado) continua simples convertendo para array.

────────────────────────────────────────
3. Integração com React-Flow (biblioteca de nodes)
────────────────────────────────────────
**a) Node components**  
  • `ToolNodeComponent` e `CodeNodeComponent` (`Canvas.tsx` linhas 38-146) são passados a `nodeTypes`.  
  • Cada node renderiza um “checkbox” embutido (linhas 58-77 / 110-132).  
  • Hover → mostra checkbox; clique → `toggleNodeSelection(id)`.

**b) Eventos de clique e box-select**  
```typescript
onNodeClick(e,node) {
  if (e.ctrlKey || e.metaKey) toggleNodeSelection(node.id);
  else { setSelectedNode(node.id); clearSelection(); }
}

onSelectionChange({ nodes }) {
  selectNodes(nodes.map(n => n.id));
}
```

**c) Modo Seleção × Modo Pan**  
• Variável local `isSelectionMode`.  
• Atalhos: S = seleção; V/P = pan.  
• Configurações React-Flow adaptadas (`selectionOnDrag`, `panOnDrag`, etc.).

────────────────────────────────────────
4. UI/UX da seleção
────────────────────────────────────────
✔ **Realce visual**  
  • Node selecionado recebe `ring-blue-400`.  
  • Checkbox vira azul com ícone ✓.

✔ **Menu flutuante “SelectionMenu”** (Canvas linhas 154-199)  
  • Mostra contagem e botões: Edit with AI, Agent with tools, Clear.  
  • Dispara `openAgentChat('edit' | 'agent')`.

✔ **Toggle de modo** – componente `SelectionModeToggle` no canto superior direito.

────────────────────────────────────────
5. Modal de Chat com IA
────────────────────────────────────────
Arquivo: `view/src/components/AgentChatModal.tsx`

• Abre quando `isAgentChatOpen = true`.  
• Obtém `selectedNodes` filtrando pelo Set.  
• Mensagem inicial contextual difere entre modos **edit** e **agent**.  
• Históricos, typing indicator e botões de ação (`edit`, `execute`, `suggest`).  
• Pontos de extensão: conectar back-end real no `handleSend` e nos action buttons.

────────────────────────────────────────
6. Fluxo completo do usuário
────────────────────────────────────────
1. Ativa “Select” (atalho S).  
2. Seleciona múltiplos nodes (Ctrl+click ou drag box).  
3. Menu flutuante surge; escolhe ação de IA.  
4. Modal abre com contexto dos nodes.  
5. IA responde; usuário pode aplicar mudanças ou executar.

────────────────────────────────────────
7. Pontos de extensão/portabilidade
────────────────────────────────────────
• **Store**: se usar outro gerenciador de estado, mantenha API similar.  
• **Biblioteca de graph**: recrie callbacks equivalentes a React-Flow.  
• **Menu & Modal**: adaptar para seu design-system.  
• **Execução real**: substituir mocks (`fakeAI`, `executeNodeMock`).

────────────────────────────────────────
8. Trechos de referência úteis
────────────────────────────────────────
```typescript
// Store de seleção
toggleNodeSelection(id)
selectNodes(ids[])
```

```tsx
// Checkbox overlay dentro do node
<div onMouseDown={handleCheckboxClick}>…</div>
```

```tsx
// Botões que abrem o modal
<Button onClick={() => openAgentChat('edit')}>Edit with AI</Button>
<Button onClick={() => openAgentChat('agent')}>Agent with this tools</Button>
```

────────────────────────────────────────
9. Checklist para implementar em outro repositório
────────────────────────────────────────
1. Criar store global com Set<string>.  
2. Adicionar checkbox e highlight nos nodes.  
3. Implementar modos Pan/Selection e eventos.  
4. Menu flutuante que aparece com seleção.  
5. Modal de IA que recebe nodes e conversa.  
6. Ligar back-end real para editar/rodar.  
7. Ajustar UX (atalhos, tooltips, loaders).

Com esses detalhes, qualquer time pode replicar a experiência de “selecionar nodes e aplicar IA” em seu próprio editor de workflows.

────────────────────────────────────────
10. Plano de Implementação no SchemaOS
────────────────────────────────────────
Este repositório (`schemaos`) já contém uma base semelhante (React-Flow no frontend + Deco Server). A seguir está um **roadmap pragmático**, passo-a-passo, para habilitar a seleção de nodes e as ações de IA descritas acima.

📅 **Timeline sugerida**: ~3 dias de trabalho concentrado.

════════════════════════════════════════
A) Infraestrutura de Estado (Frontend)
════════════════════════════════════════
1. **Extender `view/src/store.ts`**  
   • Verifique se já existe `selectedNodeIds: Set<string>` (linhas ~600).  
   • Caso contrário, adicione seguindo a API descrita no item 2.  
   • Exporte seletor `useSelectedNodes()` para reutilização por modais e menus.
2. **Integrar com os Nodes atuais** (`Canvas.tsx` + `CustomNode.tsx`)  
   • Adicione checkbox overlay e highlight tailwind `ring-sky-400`.  
   • Garanta performance memorando `selectedNodeIds.has(id)`.
3. **Hotkeys & Modes**  
   • Use `react-hotkeys-hook` para atalhos (S, V/P).  
   • Controle local `isSelectionMode` gravando no Zustand para persistir entre componentes.

════════════════════════════════════════
B) UI de Ações – Menu & Modal
════════════════════════════════════════
4. **`SelectionMenu`**  
   • Local: `view/src/canvas/SelectionMenu.tsx` (novo).  
   • Props: `count`, callbacks `onEditAI`, `onAgentAI`, `onClear`.  
   • Posição: absolute top-right do bounding box da seleção.
5. **`SchemaAssistantModal` já existe**  
   • Reutilizar (arquivo `view/src/ai/SchemaAssistantModal.tsx`), mas  
   • Passar `selectedNodes` via hook recém-criado.  
   • Acrescentar tabs “Edit” x “Generate SQL” se for o caso.

════════════════════════════════════════
C) Backend – Ferramenta AI
════════════════════════════════════════
6. **Criar/Ativar Tool Proxy**  
   • Em `server/main.ts` já existe o padrão `createAIGenerateObjectTool`.  
   • Certifique-se de registrar nos `tools` do `withRuntime`.
7. **Schemas Dinâmicos**  
   • Para **edições**: schema `{ type:"object", properties:{ suggestions:{type:"string"} }}`.  
   • Para **SQL**: schema `{ type:"object", properties:{ sql:{type:"string"} }}`.
8. **Prompt Builder utilitário**  
   • Novo arquivo `view/src/ai/buildNodePrompt.ts`.  
   • Recebe `nodes` selecionados, gera descrição markdown + instrução.

════════════════════════════════════════
D) Fluxo de Chamada RPC
════════════════════════════════════════
9. **Frontend → Server**  
   ```typescript
   const { object } = await client.AI_GENERATE_OBJECT({
     messages: [{ role:'user', content: buildNodePrompt(nodes, mode) }],
     schema: mode==='sql'? sqlSchema : editSchema,
     model: 'gpt-4o-mini', temperature: 0.3
   });
   ```
10. **Tratamento de Erro & UX**  
    • Loading spinner no modal.  
    • Mensagem de fallback se `object` vier undefined.

════════════════════════════════════════
E) Aplicando Resultados
════════════════════════════════════════
11. **Para “Edit with AI”**  
    • Parse `object.suggestions` (markdown).  
    • Exibir diff lado-a-lado e botão “Aplicar”.  
    • Ao aplicar, atualize propriedades dos nodes no estado global.
12. **Para “Generate SQL”**  
    • Copiar `object.sql` para clipboard + botão “Download .sql”.

════════════════════════════════════════
F) Testes & Qualidade
════════════════════════════════════════
13. **Mocks**  
    • Criar `tests/mocks/rpc.ts` conforme guia **ai-usage**.  
    • Unit tests para `buildNodePrompt` e hooks de seleção.
14. **E2E**  
    • Usar Cypress: selecionar nodes, abrir modal, receber resposta mockada.

════════════════════════════════════════
G) Checklist de Pull Request
════════════════════════════════════════
☑️ Seleção de nodes funcional  
☑️ Menu flutuante aparece/ some  
☑️ Modal mostra contexto correto  
☑️ Chamada `client.AI_GENERATE_OBJECT` sem `.tools`  
☑️ Resultado aplicado ou copiado conforme modo  
☑️ Cobertura de testes ≥ 80%

Com este plano, a equipe do SchemaOS pode implementar a seleção de nodes com ações de IA de forma incremental, alinhada às melhores práticas documentadas em **ai-usage.mdc**.