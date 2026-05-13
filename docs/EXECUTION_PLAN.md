# Plano De Execucao Inicial - Capture Flag

O MVP deve ser uma fatia vertical funcional: criar uma config e uma flag no client, entregar um Config JSON cacheavel e consumir essa flag via SDK.

| Ordem | Entrega |
|---|---|
| 1 | Criar monorepo TypeScript com npm workspaces |
| 2 | Subir API NestJS com Postgres e Prisma |
| 3 | Implementar OAuth com GitHub e sessao em cookie HTTP-only |
| 4 | Criar organizations, organization members, projects, configs e environments |
| 5 | Criar project members e roles por projeto |
| 6 | Implementar SDK keys por config/ambiente e endpoint publico de config |
| 7 | Criar CRUD de boolean flags e valores por ambiente |
| 8 | Criar `config_environment_states` com `revision` e `etag` |
| 9 | Gerar Config JSON proprio versionado filtrado pelo escopo da SDK key |
| 10 | Implementar `ETag`, `Cache-Control` e `304 Not Modified` no endpoint publico |
| 11 | Criar evaluator compartilhado |
| 12 | Criar SDK JS com fetch, cache em memoria, ETag e `getValue()` |
| 13 | Criar client operacional basico |
| 14 | Implementar targeting simples |
| 15 | Implementar rollout percentual deterministico |
| 16 | Adicionar cache/polling no SDK |
| 17 | Adicionar audit minimo |
| 18 | Evoluir RBAC escopado por organizacao e projeto |

## Estado Implementado

Fase atual: Fase 1 - Fundacao.

| Entrega | Estado |
|---|---|
| Monorepo TypeScript com npm workspaces | Implementado |
| API NestJS com healthcheck | Implementado |
| PostgreSQL via Docker Compose | Implementado |
| Prisma com migration inicial | Implementado |
| GitHub OAuth | Implementado na API |
| Sessao opaca em cookie HTTP-only | Implementado com hash no banco |
| Organizations e organization members | Implementado |
| Projects | Implementado |
| Config `default` criada com projeto | Implementado |
| Project members e roles | Implementado |
| Environments | Implementado |
| `config_environment_states` | Implementado para pares `config + environment` criados |
| SDK keys por `config + environment` | Implementado, chave bruta exibida apenas na criacao |
| Tenant isolation em rotas privadas | Implementado em guards/servicos de acesso |
| Client operacional basico | Implementado |

Fora do escopo desta entrega:

| Item | Fase esperada |
|---|---|
| CRUD de feature flags | Fase 2 |
| Endpoint publico `GET /public/sdk/:sdkKey/config` | Fase 2 |
| Config JSON publico | Fase 2 |
| ETag, Cache-Control e `304 Not Modified` | Fase 2 |
| Evaluator real | Fase 3 |
| SDK JS funcional | Fase 4 |
