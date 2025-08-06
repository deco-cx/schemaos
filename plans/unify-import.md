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

## Problemas Identificados

1. **Fragmentação:** 3 sistemas diferentes para mesma funcionalidade
2. **Dados Mockados:** DataSourceModal usa apenas dados hardcoded
3. **Import JSON Quebrado:** Apenas recarrega página
4. **UX Confusa:** Usuário não sabe qual usar
5. **Botão Import não funciona:** Clica e nada acontece (problema reportado)

## Plano de Unificação

### Fase 1: Criar Sistema Unificado de Import

#### 1.1 Novo Hook Unificado
**Arquivo:** `view/src/hooks/useImportData.ts`

```typescript
interface ImportSource {
  type: 'file' | 'database' | 'integration';
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface UseImportData {
  // Estado
  isModalOpen: boolean;
  currentSource: ImportSource | null;
  isImporting: boolean;
  
  // Ações
  openImportModal: () => void;
  closeImportModal: () => void;
  
  // Import methods
  importFromFile: (file: File) => Promise<void>;
  importFromDatabase: () => Promise<void>; // SQL introspection
  importFromIntegration: (integrationId: string) => Promise<void>;
}
```

#### 1.2 Modal de Import Unificado
**Arquivo:** `view/src/components/ImportDataModal.tsx`

```typescript
// Tabs para diferentes tipos de import:
// - Upload File (JSON/CSV)
// - Connect Database (SQL introspection)
// - Connect Apps (Integrations futuras)
```

### Fase 2: Integração com DB Real

#### 2.1 Converter DataSources para DB Real
1. Adicionar novo tool no servidor: `LIST_DATA_SOURCES`
2. Buscar connections disponíveis do workspace
3. Substituir MOCK_BINDINGS por dados reais

#### 2.2 Schema Discovery
```typescript
// Novo tool no servidor
createTool({
  id: "DISCOVER_SCHEMA",
  execute: async ({ context }) => {
    // Para cada data source:
    // - Listar tabelas/collections
    // - Descobrir fields e types
    // - Retornar metadata
  }
})
```

### Fase 3: Import de Arquivo Funcional

#### 3.1 Parser de JSON Schema
```typescript
interface SchemaImporter {
  parseJSON(content: string): SchemaSpec;
  parseCSV(content: string): SchemaSpec;
  parseSQL(content: string): SchemaSpec; // DDL statements
  validateSchema(schema: SchemaSpec): ValidationResult;
}
```

#### 3.2 Integração com Store
```typescript
// Em store.ts
importSchema: (schema: SchemaSpec) => {
  // Validar schema
  // Mapear para nodes/edges
  // Adicionar ao canvas com layout automático
  // Preservar bindings se existirem
}
```

### Fase 4: UI/UX Melhorado

#### 4.1 Botão Import Principal
```typescript
// App.tsx - Substituir handleImport quebrado
const handleImport = () => {
  importStore.openImportModal();
};
```

#### 4.2 Fluxo de Import
1. Clica em Import → Abre modal unificado
2. Escolhe fonte (File/DB/App)
3. Configura opções específicas
4. Preview do schema
5. Confirma e importa

### Fase 5: Migração de Código Existente

#### 5.1 Deprecar Código Antigo
- [ ] Marcar `handleImport` em App.tsx como deprecated
- [ ] Mover lógica de `handleImportFromDB` para novo sistema
- [ ] Converter `DataSourceModal` para usar dados reais

#### 5.2 Manter Compatibilidade
- [ ] Wrapper temporário para código existente
- [ ] Migração gradual de funcionalidades
- [ ] Testes de regressão

## Implementação Sugerida

### Passo 1: Hook Básico (1 dia)
```typescript
// useImportData.ts
export const useImportData = create<ImportDataState>((set, get) => ({
  isModalOpen: false,
  currentSource: null,
  isImporting: false,
  
  openImportModal: () => set({ isModalOpen: true }),
  closeImportModal: () => set({ isModalOpen: false }),
  
  importFromDatabase: async () => {
    // Reusar lógica de SchemaAssistantModal
    const response = await client.RUN_SQL({ sql: introspectionQuery });
    // Processar e adicionar nodes
  }
}));
```

### Passo 2: Modal Unificado (2 dias)
- Tabs para diferentes fontes
- Preview de schema antes de importar
- Mapeamento de fields customizável

### Passo 3: Integração Real (3 dias)
- Conectar com DECO_CHAT_WORKSPACE_API
- Listar data sources reais
- Schema discovery dinâmico

### Passo 4: Testes e Polish (2 dias)
- Testes unitários
- Testes E2E
- Melhorias de UX
- Documentação

## Benefícios da Unificação

1. **UX Simplificada:** Um único ponto de entrada para imports
2. **Dados Reais:** Conexão com databases e APIs reais
3. **Extensível:** Fácil adicionar novos tipos de import
4. **Manutenível:** Código centralizado e organizado
5. **Testável:** Estrutura clara para testes

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Quebrar funcionalidade existente | Manter código antigo temporariamente |
| Complexidade de migração | Implementar em fases pequenas |
| Performance com dados grandes | Implementar paginação e lazy loading |
| Segurança de credentials | Usar sistema de auth do Deco |

## Métricas de Sucesso

- [ ] Botão Import funciona consistentemente
- [ ] Tempo de import < 3 segundos para schemas médios
- [ ] 0 erros em imports de arquivos válidos
- [ ] Suporte a 3+ formatos de import
- [ ] Redução de 3 sistemas para 1 sistema unificado

## Timeline Estimado

- **Semana 1:** Hook básico + Modal UI
- **Semana 2:** Integração com DB real
- **Semana 3:** Import de arquivo + Testes
- **Semana 4:** Polish + Documentação

Total: **4 semanas** para unificação completa

## Próximos Passos Imediatos

1. **Quick Fix:** Fazer botão Import abrir DataSourceModal existente
2. **Começar Hook:** Criar `useImportData.ts` com estrutura básica
3. **Protótipo Modal:** Design do modal unificado
4. **Validar com Equipe:** Revisar plano antes de implementar