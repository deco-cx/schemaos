# Unificação do Sistema de Import de Data Sources

## Situação Atual

Atualmente existem **3 sistemas de import paralelos** que não estão integrados:

### 1. Import de Arquivo JSON (❌ Quebrado)
**Localização:** `view/src/App.tsx:84-107`
```typescript
const handleImport = () => {
  // Cria input file, lê JSON
  // Faz window.location.reload() - hack temporário
  // NÃO importa realmente os dados
}
```
**Status:** Mockado/quebrado - apenas recarrega a página

### 2. Import de Data Sources Mock (✅ Funciona parcialmente)
**Localização:** `view/src/components/DataSourceModal.tsx`
- **Hook:** `view/src/hooks/useDataSources.ts`
- **Dados:** `view/src/mockData.ts` (MOCK_BINDINGS, INTEGRATIONS)

**Como funciona:**
1. Modal exibe lista de data sources (Shopify, Stripe, Airtable, etc)
2. Usuário seleciona entidades
3. Sistema cria nodes no canvas com fields pré-definidos
4. **PROBLEMA:** Dados são hardcoded, não conecta com DB real

**Código chave:**
```typescript
// DataSourceModal.tsx:21-59
const handleAddEntity = (entityId: string) => {
  // Pega integration e binding mockados
  // Cria novo node com fields pré-definidos
  // Adiciona ao canvas
}
```

### 3. Import de DB Real via SQL (✅ Funciona)
**Localização:** 
- `view/src/ai/SchemaAssistantModal.tsx:72-142`
- `view/src/canvas/NodeAIModal.tsx:131-similar`

**Como funciona:**
1. Executa query de introspection no SQLite
2. Agrupa colunas por tabela
3. Converte para formato de schema
4. Gera nodes com fields reais

**RPC Tool:** `server/main.ts:112-142`
```typescript
createTool({
  id: "RUN_SQL",
  execute: async ({ context }) => {
    return await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL({
      sql: context.sql,
      params: context.params,
    });
  },
})
```

---

## 🆕 Revisão de Escopo (V2)

Sob orientação do product owner, **simplificaremos** o sistema de import para dois fluxos principais e descontinuaremos as opções mockadas/JSON:

| Import Option | Descrição | Status |
|---------------|-----------|--------|
| **Describe with natural language** | Usuário descreve o que deseja em texto livre. A IA converte para nosso `SchemaSpec` e adiciona ao canvas | **Novo** |
| **Import from Deco SQLite** | Front-end chama `GET_DATABASE_SCHEMA` → back-end usa `RUN_SQL` para introspecção → usuário escolhe tabelas → nodes gerados e posicionados automaticamente | **Novo** |

Link para instalar mais apps (futuro): [https://deco.chat/connections](https://deco.chat/connections) (desativado nesta etapa).

### 📐 Schema Único
- Manteremos **apenas um** tipo de schema compartilhado (`SchemaSpec`, já usado por `SchemaAssistantModal`).
- Todas as rotas (NL e SQLite) devem produzir exatamente essa estrutura antes de enviar ao canvas.

---

## 🔧 Alterações Necessárias

### 1. Backend / Tools

| Tool | Local | Responsabilidade |
|------|-------|------------------|
| `RUN_SQL` | _já existe_ | Executar SQL arbitrário na base SQLite |
| **`GET_DATABASE_SCHEMA`** | **NOVO** → `server/main.ts` | 1) Receber opcionalmente `tables?: string[]` 2) Montar introspection query 3) Usar `RUN_SQL` internamente 4) Retornar `SchemaSpec` com tabelas/colunas |
| `AI_GENERATE_OBJECT` | _já existe_ | Converter NL → `SchemaSpec` |

> Observação: `GET_DATABASE_SCHEMA` **não** deve ser exposto diretamente ao modelo; apenas como RPC para o front-end.

### 2. Front-end

1. **Novo Hook:** `useImportData.ts` (substitui `useDataSources.ts`)
2. **Novo Modal:** `ImportDataModal.tsx`
   - **Tabs:** "Natural Language" | "SQLite"
   - **Natural Language Tab**
     - TextArea + botão **Generate**
     - Chama `client.AI_GENERATE_OBJECT` com schema esperado
   - **SQLite Tab**
     - Botão **Load Tables** → chama `client.GET_DATABASE_SCHEMA` (sem filtro) → recebe listagem
     - UX de seleção de tabelas (checkbox list + search)
     - Após seleção, chama novamente `client.GET_DATABASE_SCHEMA({ tables: selected })` (ou filtra client-side) para schema final
3. **Canvas Integration**
   - Função `appendSchemaToCanvas(schema: SchemaSpec)`
   - Conversão `SchemaSpec` → `ObjectNode[] | RelationEdge[]`
   - **Auto-layout**: usar grid simples ou biblioteca `dagre` para espaçar nodes `≥ 200px` em X/Y

### 3. UX & Design Considerations (Para AI / implementador)

- **Selection UX**
  - Tabelas listadas com badge de n° de colunas
  - "Select All" + busca incremental
  - Desabilitar botão **Importar** até ≥1 tabela
- **Node Placement**
  - Distribuir nodes no grid 4×N, linhas de 250 px, colunas de 350 px
  - Após inserção, chamar `react-flow` `fitView()`
  - Desenhar relações (se futuras versões inferirem FKs) com curvatura suave; evitar sobreposição
- **Empty State**
  - Se não houver tabelas, mostrar callout "No tables found" + link docs
- **Performance**
  - Paginar lista se >50 tabelas
  - Lazy-load colunas somente na seleção

### 4. Atualização do Plano de Projeto

Substituir fases anteriores:

1. **Semana 1** – Hook & Modal c/ NL + SQLite stub
2. **Semana 2** – Implementar `GET_DATABASE_SCHEMA` + introspecção + seleção de tabelas
3. **Semana 3** – Auto-layout + validações + polish UI
4. **Semana 4** – Testes + documentação + cleanup código legado

Métricas de sucesso permanecem as mesmas, mas a **redução agora é de 3 → 2 sistemas** (JSON/mock removidos).

---

## 📑 Instruções de Implementação para o Próximo Assistente

1. **Criar Tool `GET_DATABASE_SCHEMA`** em `server/main.ts` seguindo padrão de `RUN_SQL`.
2. **Gerar tipos** com `npm run gen:self` para expor no client.
3. **Criar `useImportData.ts`** com estado e chamadas RPC.
4. **Criar `ImportDataModal.tsx`** com tabs NL / SQLite e fluxo descrito.
5. **Substituir** `handleImport` em `App.tsx` para abrir o novo modal.
6. **Remover** ou marcar como deprecated `DataSourceModal` e mocks.
7. **Implementar Converter** `SchemaSpec` → `ObjectNode` (já existe função em `SchemaAssistantModal`, reutilizar).
8. **Adicionar Auto-layout** simples pós-merge (grid ou dagre).
9. **Escrever testes unitários** para hook + converter.
10. **Atualizar documentação**.

---

## 🚀 Próximos Passos Imediatos (Sprint-0)

- [ ] Adicionar `GET_DATABASE_SCHEMA` (backend)
- [ ] Setup hook + modal esqueleto (frontend)
- [ ] Wire botão Import principal
- [ ] Reaproveitar conversor existente

❤️ **Bons códigos!**