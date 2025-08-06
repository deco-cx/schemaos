# Projetos & Workspaces

Este documento descreve a feature de **Projetos** agrupados em **Workspaces**, semelhante ao fluxo do Excalidraw Pro, permitindo que o usuário troque rapidamente entre diferentes contextos de trabalho ou crie novos. Ele também apresenta um plano de implementação em etapas, interfaces de persistência com armazenamento local inicial e diretrizes para futura migração a um back-end externo.

---

## 1. Visão Geral

1. O usuário pode criar múltiplos **Workspaces** (ex.: "Acme Inc.", "Estudos", "Pessoal").
2. Dentro de cada workspace há **Projetos** (ex.: "CRM Schema", "Data Lake", "App de Estoque").
3. O seletor fica no canto superior esquerdo (`top-left`) da UI:
   * Primeira linha → *Workspace* (dropdown).
   * Segunda linha → *Projeto* (dropdown com opção "➕ Novo Projeto").
4. Abrir um projeto carrega todo o seu estado (schemas, canvas, explorer, etc.) isoladamente.
5. Todo o sistema continua **offline-first**, salvando em `localStorage`/`indexedDB`.
6. A arquitetura isola a **Camada de Persistência** via **Repositorio** para facilitar a troca por um back-end futuro (REST/GraphQL/SupaBase/etc.).

---

## 2. Requisitos Funcionais

| ID | Descrição |
|----|-----------|
| RF01 | Criar, renomear e remover Workspaces localmente. |
| RF02 | Criar, renomear, duplicar e remover Projetos dentro de um Workspace. |
| RF03 | Selecionar Workspace → filtrar Projetos daquele Workspace. |
| RF04 | Selecionar Projeto → carregar estado completo nas views existes (canvas, explorer, preview). |
| RF05 | Persistir automaticamente alterações de um Projeto. |
| RF06 | Guardar último Workspace/Projeto aberto (experiência _return-to-last_). |
| RF07 | Importar/Exportar Projeto como arquivo JSON. |

---

## 3. Requisitos Não-Funcionais

* **Offline-First**: 100 % funcional sem internet.
* **Substituível**: Trocar a implementação de persistência sem impactar a UI/Stores.
* **Scalável**: Estrutura de dados preparada para múltiplos usuários (futuro).
* **Performance**: Carregamento < 100 ms para Projetos de até 5 MB no local.
* **Testável**: Repositórios isolados → testes unitários.

---

## 4. Modelo de Dados (Typescript)

```ts
// src/types/project.ts

// Team vem da API TEAMS_LIST do Deco
export interface Team {
  id: number;
  name: string;
  slug: string;
  theme?: {
    picture?: string;
    variables?: Record<string, string>;
  };
  created_at: string;
  avatar_url?: string;
}

// Workspace agora pode estar vinculado a um Team
export interface Workspace {
  id: string;        // uuid local
  name: string;
  teamId?: number;   // ID do team do Deco (opcional, null = local)
  createdAt: string; // ISO
  updatedAt: string;
  isLocal: boolean;  // true = localStorage, false = vinculado ao Deco
}

export interface Project {
  id: string;        // uuid
  workspaceId: string;
  name: string;
  data: ProjectData; // Schema, nodes, edges, explorer filters...
  createdAt: string;
  updatedAt: string;
}
```
`ProjectData` pode reaproveitar a estrutura já usada hoje pelo app para o schema/canvas.

### 4.1. Integração com Teams do Deco

Quando o usuário fizer login, o sistema irá:
1. Chamar `TEAMS_LIST` para obter os times do usuário
2. Criar automaticamente um Workspace para cada Team retornado
3. Permitir que o usuário também crie Workspaces locais (sem teamId)

---

## 5. Camada de Persistência

### 5.1. Interface Abstrata

```ts
// src/repositories/IProjectRepository.ts
export interface IProjectRepository {
  /* Teams (from Deco API) */
  listTeams(): Promise<Team[]>;
  syncTeamsToWorkspaces(teams: Team[]): Promise<void>;

  /* Workspaces */
  listWorkspaces(): Promise<Workspace[]>;
  createWorkspace(name: string, teamId?: number): Promise<Workspace>;
  renameWorkspace(id: string, name: string): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  getWorkspaceByTeamId(teamId: number): Promise<Workspace | null>;

  /* Projects */
  listProjects(workspaceId: string): Promise<Project[]>;
  createProject(workspaceId: string, name: string): Promise<Project>;
  duplicateProject(projectId: string): Promise<Project>;
  renameProject(id: string, name: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
  loadProject(id: string): Promise<Project>;
  saveProject(project: Project): Promise<void>;
}
```

### 5.2. Implementação Local (inicial)

```ts
// src/repositories/LocalProjectRepository.ts
export class LocalProjectRepository implements IProjectRepository {
  private LS_KEY = "schemaos.v1"; // tudo num único objeto versionado
  ...
}
```
* Usa `localStorage` para metadados + `indexedDB` (via `idb-keyval`) para blobs maiores.

### 5.3. Futuro Back-End

Basta criar `RemoteProjectRepository` que implemente a mesma interface e injetar via **Factory/Context**:

```ts
export const ProjectRepositoryContext = createContext<IProjectRepository>(new LocalProjectRepository());
```
* UI/Stores continuam iguais, trocando o provider no nível root.

---

## 6. State Management

* Criar slice `useWorkspaceStore` (Zustand + persist?).
* Estrutura:
```ts
interface WorkspaceState {
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  workspaces: Workspace[];
  projects: Record<string, Project[]>; // indexado por workspace
  actions: {
    switchWorkspace(id: string): void;
    switchProject(id: string): void;
    // wrappers chamando o repository
  }
}
```
* Persistir apenas `currentWorkspaceId` e `currentProjectId` para restauração rápida; resto vem do repository.

---

## 7. UI/UX

| Componente | Descrição |
|------------|-----------|
| `WorkspaceSwitcher` | Dropdown com lista de workspaces + opção "➕ Novo Workspace". |
| `ProjectSwitcher`   | Dropdown dependente mostrando projetos do workspace selecionado + "➕ Novo Projeto". |
| `ProjectModal`      | Modal para criar/renomear/duplicar/excluir projetos. |

Layout pro topo esquerdo (pseudo-JSX):
```tsx
<div className="pl-4 pt-3 flex flex-col gap-1">
  <WorkspaceSwitcher />
  <ProjectSwitcher />
</div>
```

#### Atalhos de Teclado
* `⌘⇧P` → abrir palette de projetos.
* `⌘⇧W` → abrir palette de workspaces.

---

## 8. Rotas (opcional/futuro)

`/#/:workspaceId/:projectId`

Permite deep-link e colaborar em tempo real no futuro (WebRTC/WebSocket).

---

## 9. Migração do Estado Atual

1. Na primeira execução pós-feature, criar workspace "Default".
2. Converter o projeto único existente em um Project dentro desse workspace.
3. Salvar usando novo schema.

---

## 10. Plano de Implementação

| Fase | Tarefas | Pull Requests |
|------|---------|---------------|
| 1. Modelos & Interface | • Definir types `Workspace`/`Project`  \n• Criar `IProjectRepository` | PR-A |
| 2. Persistência Local  | • `LocalProjectRepository`  \n• Migração de dados | PR-B |
| 3. State Management    | • `useWorkspaceStore`  \n• Hooks utilitários | PR-C |
| 4. UI Básica           | • `WorkspaceSwitcher`  \n• `ProjectSwitcher` | PR-D |
| 5. Integração App      | • Injetar provider  \n• Migrar páginas/explorer para ler `currentProject` | PR-E |
| 6. Refino & QA         | • Testes unitários (repository)  \n• E2E flows (Cypress) | PR-F |
| 7. Export/Import       | • JSON serialization  \n• UI de import/export | PR-G |

Cada fase deve passar por code review e smoke tests.

---

## 11. Pontos de Atenção

* **Collisions de ID**: usar `crypto.randomUUID()`.
* **Tamanho do localStorage**: mover blobs > 5 MB para `indexedDB`.
* **Atomicidade**: salvar projeto após `debounce` 500 ms para reduzir escrita.
* **Versões de Schema**: colocar `version` em `ProjectData` para migrações futuras.

---

## 12. Guia para Integração com Back-End Futuro

1. **Autenticação**: adicionar `userId` ao modelo.
2. **Endpoints REST**: `/workspaces`, `/projects`.
3. **Sync Strategy**: optimistic-UI + `updatedAt`/`version` conflicts.
4. **Feature Flags**: usar `RemoteProjectRepository` somente quando `process.env.REMOTE_PROJECTS === 'true'`.
5. **Tests**: mocks que implementem `IProjectRepository` para unitários.

---

## 13. Glossário

* **Workspace**: Pasta lógica que agrupa projetos.
* **Projeto**: Conjunto de dados (schemas, visualizações) editável.
* **Repository**: Objeto responsável por persistir e recuperar dados (Local ou Remoto).

---

> **Próximos Passos**: Iniciar Fase 1 criando o novo módulo de tipos e interface, seguida de uma prova de conceito da persistência local.
