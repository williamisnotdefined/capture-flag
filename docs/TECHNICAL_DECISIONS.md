# Decisoes Tecnicas - Capture Flag

## Decisoes Tecnicas Fechadas

| Area | Decisao |
|---|---|
| Monorepo | TypeScript + npm workspaces |
| API | NestJS |
| Client | Vite + React |
| Client server state | TanStack React Query |
| UI | shadcn/ui + Radix |
| Banco | PostgreSQL |
| ORM | Prisma |
| Auth inicial | GitHub OAuth |
| Sessao do client | Cookie HTTP-only |
| SDK/config | SDK proprio + JSON proprio versionado |
| Modelo de produto | SaaS multi-tenant desde o inicio |
| Package scope | `@capture-flag/*` |
| Lint/format | Biome |
| Infra local | Docker Compose |
| Cache futuro | Redis |
| Testes | Vitest/Jest conforme pacote |

## Decisoes Da Implementacao Atual

| Area | Decisao |
|---|---|
| API dev runner | `tsx watch` em vez de Nest CLI para manter o scaffold inicial menor |
| OAuth GitHub | Implementacao direta com `fetch`, sem Passport, para reduzir dependencias na Fase 1 |
| Client Fase 1 | React + TanStack Query com CSS simples; shadcn/ui fica para polimento posterior |
| SDK JS | `@capture-flag/sdk-js` busca o Config JSON publico, usa cache em memoria e avalia localmente |
| Evaluator | Motor local implementado no pacote `@capture-flag/evaluator` e integrado ao SDK JS |
| Tenant isolation | Centralizada em `AccessService`, usada por rotas privadas de organizacao/projeto |
| Segments | Segmentos reutilizaveis sao escopados por config, emitidos no Config JSON e avaliados localmente pelo evaluator/SDK |
| Advanced targeting | Operadores avancados e prerequisite flags permanecem em JSONB e sao avaliados localmente pelo evaluator/SDK |
| Audit logs | Gerados automaticamente pelo backend; nenhum campo obrigatorio do audit depende de input explicito do usuario |
| RBAC | `AccessService` centraliza tenant access; `owner`/`admin` da organizacao podem satisfazer acesso de projeto, `developer` gerencia flags e `project_admin` gerencia recursos administrativos do projeto |

## Modelo De Dados Inicial

O detalhamento relacional completo esta em [`DATA_MODEL.md`](DATA_MODEL.md).

O modelo inicial deve conter apenas as entidades necessarias para a primeira fatia vertical: login, organizacao, projetos, configs, ambientes, SDK keys, flags, valores por ambiente, estado publicavel da config e audit logs.

Observacoes de modelagem:

| Decisao | Motivo |
|---|---|
| `users` e `oauth_accounts` ficam separados | Um usuario pode ter mais de um provedor OAuth; o usuario da plataforma nao deve depender de um unico provedor externo |
| `sessions` e uma entidade propria | Cookie HTTP-only deve usar token opaco; o banco armazena somente hash, expiracao e revogacao |
| `configs` fica entre projeto e flags | Um projeto pode ter mais de um conjunto de flags consumido por SDKs diferentes |
| `sdk_keys` fica fora de `projects` | SDK key e por config/ambiente e precisa suportar rotacao, revogacao, `last_used_at` e multiplas chaves ativas no futuro |
| `feature_flag_environment_values` | O nome deixa claro que o valor/configuracao da flag varia por ambiente |
| `config_environment_states` | Guarda `revision` e `etag` do par `config + environment` para cache HTTP desde o MVP |
| Rules e percentage rollout iniciam como JSONB | Evita normalizacao prematura; tabelas dedicadas so entram se a UI/queries exigirem |
| Audit logs | Alteracao de flag em producao sem rastro e um risco maior que o custo da tabela; a Fase 9 evolui o audit para filtros, old/new/metadata e eventos de membros/config publish |

Tabelas propositalmente fora do modelo inicial:

| Tabela | Fase | Motivo para nao entrar no MVP |
|---|---|---|
| targeting_rules | Fase 3 | Rules existem no MVP, mas ficam em `rules_json`; tabela dedicada seria normalizacao prematura |
| percentage_options | Fase 3 | Rollout percentual existe no MVP, mas fica em `percentage_options_json`; tabela dedicada so entra se a UI/queries exigirem |
| webhooks | Removida do MVP | Dependem de eventos de alteracao estaveis |
| api_tokens | Fase 13 | Necessarios apenas para Public Management API; client usa sessao |

Requisito obrigatorio: toda entidade operacional deve ser alcancavel a partir de `organization_id` direta ou indiretamente. Nenhuma query de leitura ou escrita pode depender apenas de IDs globais sem validar o tenant atual.

## Decisoes Futuras

Nao ha decisoes tecnicas bloqueantes para iniciar a Sprint 1.

| Decisao futura | Momento ideal |
|---|---|
| Adicionar Google OAuth | Depois do fluxo GitHub estar estavel |
| Definir cloud provider | Antes do primeiro deploy externo |
| Definir estrategia de billing | Antes da Fase 21 |
| Definir Redis obrigatorio ou opcional | Antes da Fase 17 |
