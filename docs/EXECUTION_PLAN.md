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
| 11 | Implementar Remote Config JSON com `json_object` e `json_array` |
| 12 | Manter Integrations e Webhooks fora do MVP |
| 13 | Criar Public Management API |

## Estado Implementado

Fase atual: Fase 15 - Security implementada.

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
| CRUD de feature flags e valores por ambiente | Implementado |
| Endpoint publico de config com cache HTTP | Implementado |
| Audit minimo | Implementado para flags, valores de flags e SDK keys |
| Evaluator compartilhado | Implementado no pacote `@capture-flag/evaluator` e integrado ao SDK JS |
| SDK JS funcional | Implementado com fetch do Config JSON publico, cache em memoria e avaliacao local |
| React SDK | Implementado com Provider e hook `useFeatureFlag` |
| Cache e polling no SDK | Implementado com lazy loading padrao, manual refresh, auto polling, offline mode, ETag e `304 Not Modified` |
| React SDK live updates | Implementado com subscriptions no SDK JS e re-render automatico do hook |
| Segments | Implementado com CRUD por config, Config JSON publico e avaliacao local no SDK |
| Advanced Targeting | Implementado com prerequisites, array contains, date comparisons e SemVer completo no evaluator/SDK |
| Client Melhorado | Implementado com busca/filtros/tags/status de flags, valores por ambiente, project member management, switchers, SDK key revoke/rotate, JSON preview e timeline minima |
| Audit Logs Avancados | Implementado com API filtravel, timeline no client, audit automatico de membros/configs/publish e old/new/metadata visiveis |
| RBAC | Implementado com matriz de permissoes por organizacao/projeto, gestao completa de membros de organizacao/projeto, gates no client e testes de acesso |
| Remote Config JSON | Implementado com `json_object`, `json_array`, validacao no client/API, Config JSON publico preservado e suporte no evaluator/SDK |
| Public Management API | Implementado com API tokens hash-only, scopes, rate limit, OpenAPI e rotas versionadas |
| Security | Implementado com Helmet, CORS explicito, HTTPS obrigatorio em producao, suporte a proxy, rate limit por SDK key/IP e IP global, tokens/chaves hash-only e testes regressivos |

Proximas fases apos Security permanecem fora do estado implementado atual.
