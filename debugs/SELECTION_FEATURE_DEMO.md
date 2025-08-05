# Node Selection Feature - Demo Guide

A funcionalidade de seleção de nodes com ações de IA foi implementada com sucesso! 🎉

## Como Testar

### 1. Iniciando os Serviços
```bash
# Terminal 1 - Frontend
cd view && npm run dev

# Terminal 2 - Backend
cd server && npm run dev
```

### 2. Usando a Funcionalidade

#### Modos de Interação
- **Pan Mode (Padrão)**: Navegar e mover o canvas
- **Selection Mode**: Selecionar múltiplos nodes
- **Atalhos**: 
  - `S` = Selection Mode
  - `V` ou `P` = Pan Mode  
  - `Escape` = Sair do Selection Mode

#### Selecionando Nodes
1. Pressione `S` ou clique no botão "Select" no canto superior esquerdo
2. Selecione nodes de duas formas:
   - **Clique individual**: Ctrl/Cmd + clique em nodes
   - **Box select**: Arraste para criar uma caixa de seleção
   - **Checkbox**: Clique no checkbox que aparece no canto superior direito de cada node

#### Ações de IA
Quando nodes estão selecionados, aparece um menu flutuante no canto superior direito com:

1. **Edit with AI**: 
   - Analisa os schemas selecionados
   - Sugere melhorias, otimizações e correções
   - Recomendações sobre tipos, campos, relacionamentos, etc.

2. **Generate SQL**:
   - Gera statements CREATE TABLE para os nodes selecionados
   - Sintaxe compatível com PostgreSQL
   - Inclui constraints, tipos de dados apropriados
   - Usa convenções snake_case

## Funcionalidades Implementadas

### ✅ Estado de Seleção (Zustand Store)
- `selectedNodeIds: Set<string>` - IDs dos nodes selecionados
- `isSelectionMode: boolean` - Modo atual (pan/select)
- `toggleNodeSelection()`, `selectNodes()`, `clearSelection()`

### ✅ UI/UX
- **Checkbox visual** nos nodes em modo seleção
- **Highlight azul** nos nodes selecionados (`ring-sky-400`)
- **Toggle de modo** no canto superior esquerdo
- **Menu flutuante** com contagem e ações

### ✅ Eventos React-Flow
- `onNodeClick` com suporte a Ctrl/Cmd para multi-seleção
- `onSelectionChange` para box-select
- `selectionOnDrag` e `panOnDrag` configurados dinamicamente

### ✅ Hotkeys (react-hotkeys-hook)
- `S` - Ativar Selection Mode
- `V/P` - Ativar Pan Mode
- `Escape` - Sair e limpar seleção

### ✅ Modal de IA
- Interface conversacional para ações de IA
- Preview dos nodes selecionados
- Resultados com opções de copiar/download
- Loading states e error handling

### ✅ Backend Tool (Deco Server)
- `NODE_AI_ASSISTANT` tool registrada
- Suporte aos modos 'edit' e 'sql'
- Prompts otimizados para cada contexto
- Proxy para `DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT`

### ✅ Utilitários
- `buildNodePrompt()` - Gera prompts contextuais
- Schemas dinâmicos baseados no modo
- Tratamento de erros robusto

## Arquitetura

```
Frontend (React)
├── SelectionModeToggle - Toggle pan/select
├── CustomNode - Checkbox + highlight
├── SelectionMenu - Floating action menu  
├── NodeAIModal - AI interaction interface
└── Canvas - Event handling + hotkeys

Backend (Deco Server)
└── NODE_AI_ASSISTANT - AI tool proxy

Data Flow
User Selection → Store State → AI Modal → RPC Call → AI Response → UI Update
```

## Próximos Passos (Opcionais)

1. **Persistência**: Salvar seleções no localStorage
2. **Undo/Redo**: Histórico de ações de IA
3. **Batch Operations**: Aplicar mudanças em lote
4. **Templates**: Salvar/carregar prompts personalizados
5. **Export**: Múltiplos formatos (SQL, JSON Schema, etc.)

A funcionalidade está completa e pronta para uso! 🚀