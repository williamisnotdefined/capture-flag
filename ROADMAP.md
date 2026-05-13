# Roadmap - Capture Flag

## Objetivo

Construir uma plataforma de feature flags e remote config inspirada em serviços como ConfigCat, mas com domínio, SDK e formato de configuração próprios.

O produto deve permitir que times criem organizações, projetos, ambientes, feature flags, regras de targeting, rollouts percentuais e SDKs capazes de consumir configurações localmente com cache.

## Stack Definida

| Area | Tecnologia |
|---|---|
| Monorepo | TypeScript + npm workspaces |
| Dashboard | Vite + React |
| Dashboard data fetching | TanStack React Query |
| UI | shadcn/ui + Radix |
| API | NestJS |
| Banco | PostgreSQL |
| ORM | Prisma |
| Auth | OAuth com GitHub primeiro |
| Sessao | Cookie HTTP-only |
| SDK inicial | JavaScript/TypeScript |
| Package scope | `@capture-flag/*` |
| Lint/format | Biome |
| Cache futuro | Redis |
| Infra local | Docker Compose |
| Testes | Vitest/Jest conforme pacote |

## Decisoes Tecnicas Fechadas

| Decisao | Escolha |
|---|---|
| Monorepo | npm workspaces |
| API | NestJS |
| Dashboard | Vite + React |
| UI | shadcn/ui + Radix |
| Client state/server state | TanStack React Query |
| Banco | PostgreSQL |
| ORM | Prisma |
| Auth inicial | GitHub OAuth |
| Sessao do dashboard | Cookie HTTP-only |
| SDK/config | SDK proprio + JSON proprio versionado |
| Modelo de produto | SaaS multi-tenant desde o inicio |
| Package scope | `@capture-flag/*` |
| Lint/format | Biome |
| Infra local | Docker Compose |

## Principios Do Produto

| Principio | Descricao |
|---|---|
| Avaliacao local | SDK avalia flags localmente; dados do usuario nao sao enviados para a API |
| Config versionado | O JSON publico deve ter versao de schema desde o inicio |
| Multi-tenant seguro | Todas as entidades importantes devem ser isoladas por organizacao/projeto |
| Self-host friendly | O projeto deve rodar localmente com Docker Compose sem depender de infra SaaS |
| SDK first | O dashboard cria configuracoes; o SDK precisa ser confiavel para uso em producao |
| Menor MVP util | Priorizar uma fatia vertical funcionando antes de recursos enterprise |

## Termos Do Dominio

| Termo | Descricao |
|---|---|
| Organization | Conta, empresa ou time dono dos projetos |
| Project | Produto/aplicacao onde as flags vivem |
| Environment | Ambiente como development, staging e production |
| Feature Flag | Setting booleano para ligar/desligar comportamento |
| Remote Config | Setting nao booleano: string, integer, double ou JSON |
| SDK Key | Chave publica somente leitura usada por SDKs |
| Targeting Rule | Regra para servir valor diferente por usuario/contexto |
| Segment | Grupo reutilizavel de condicoes de usuario |
| Audit Log | Registro imutavel de alteracoes |
| Config Version | Snapshot publicado da configuracao de um ambiente |

## Compatibilidade De SDK E Config JSON

Existem duas estrategias possiveis para o formato entregue aos SDKs.

| Estrategia | Descricao | Impacto |
|---|---|---|
| SDK proprio + JSON proprio | Criamos nosso endpoint publico de config e nosso SDK sabe ler esse formato | Decisao final do produto |
| Compatibilidade com ConfigCat | Gerar um JSON compativel com SDKs oficiais do ConfigCat | Fora do escopo do MVP e nao sera objetivo inicial |

Decisao: usar SDK proprio e JSON proprio versionado desde o inicio.

Exemplo inicial:

```json
{
  "schemaVersion": 1,
  "projectKey": "my-project",
  "environment": "production",
  "generatedAt": "2026-05-12T00:00:00.000Z",
  "flags": {
    "newCheckout": {
      "type": "boolean",
      "defaultValue": false,
      "rules": [],
      "percentageOptions": []
    }
  }
}
```

Nao tentaremos ser compativeis com o formato interno do ConfigCat. Isso reduz complexidade e permite evoluir o SDK sem depender de outro produto.

## SaaS Multi-Tenant Vs Self-Hosted Local

SaaS multi-tenant significa que uma unica instalacao atende varias organizacoes/clientes. Isso exige isolamento forte por tenant, permissoes, OAuth multi-org, rate limit, auditoria e billing futuro.

Self-host/local first significa que uma instalacao atende uma empresa ou time. Essa nao sera a estrategia principal do produto, mas a infraestrutura de desenvolvimento deve continuar simples de rodar localmente.

Decisao: SaaS multi-tenant desde o inicio, com infraestrutura local apenas para desenvolvimento, testes e operacao simples.

| Decisao | Escolha |
|---|---|
| Banco | Sempre escopado por organization/project |
| API | Sempre validar acesso por tenant |
| Auth | OAuth com usuarios globais e membership por organizacao |
| Deploy local | Docker Compose com API, dashboard e Postgres |
| SaaS futuro | Billing, quotas e planos entram depois |
| Self-host futuro | Possivel, mas nao deve comprometer o desenho SaaS multi-tenant |

## Modelo De Dados Inicial

| Entidade | Responsabilidade |
|---|---|
| users | Usuarios autenticados |
| oauth_accounts | Contas OAuth vinculadas a usuarios |
| organizations | Tenants principais |
| organization_members | Associacao usuario-organizacao |
| projects | Projetos dentro de uma organizacao |
| environments | Ambientes dentro de um projeto |
| sdk_keys | Chaves publicas somente leitura por projeto/ambiente |
| feature_flags | Metadata das flags/settings |
| feature_flag_values | Valores e regras por ambiente |
| targeting_rules | Regras ordenadas de avaliacao |
| percentage_options | Rollouts percentuais |
| segments | Segmentos reutilizaveis |
| audit_logs | Historico imutavel de alteracoes |
| config_versions | Snapshots publicados |
| api_tokens | Tokens para API publica futura |
| webhooks | Integracoes futuras |

Requisito obrigatorio: toda entidade operacional deve ser alcançavel a partir de `organization_id` direta ou indiretamente. Nenhuma query de leitura ou escrita pode depender apenas de IDs globais sem validar o tenant atual.

## Fase 1 - Fundacao

Objetivo: criar a base minima para autenticar usuarios, criar organizacoes, projetos, ambientes e SDK keys.

Entregas:

| Area | Entrega |
|---|---|
| Monorepo | Estrutura `apps/api`, `apps/dashboard`, `packages/shared`, `packages/sdk-js`, `packages/evaluator` |
| API | NestJS inicial com healthcheck, config env e conexao PostgreSQL |
| Banco | Migrations iniciais |
| Auth | OAuth inicial com GitHub |
| Organization | Criar, listar e selecionar organizacao |
| Project | CRUD basico de projetos |
| Environment | Criar ambientes por projeto |
| SDK Keys | Gerar chave publica por projeto/ambiente |
| Tenant isolation | Guards/servicos devem validar organizacao e membership em todas as rotas privadas |
| Dashboard | Login, seletor de organizacao, projeto e ambiente |

Critérios de aceite:

| Criterio |
|---|
| Usuario consegue entrar via OAuth |
| Usuario consegue criar uma organizacao |
| Usuario consegue criar um projeto |
| Usuario consegue criar ambientes |
| Usuario consegue copiar uma SDK key |
| Usuario nao consegue acessar recursos de outra organizacao |

## Fase 2 - Feature Flags Core

Objetivo: permitir criacao e entrega publica de flags e configs simples.

Tipos suportados:

| Tipo | Uso |
|---|---|
| boolean | Feature flag classica |
| string | Texto/config simples |
| integer | Numero inteiro |
| double | Numero decimal |

Campos da flag:

| Campo | Descricao |
|---|---|
| key | Identificador usado no codigo |
| name | Nome legivel |
| description | Descricao |
| type | Tipo do valor |
| tags | Organizacao visual |
| hint | Ajuda de uso |
| owner | Responsavel |
| created_at | Criacao |
| updated_at | Ultima alteracao |
| archived_at | Arquivamento futuro |

Valor por ambiente:

| Campo | Descricao |
|---|---|
| default_value | Valor servido quando nenhuma rule casa |
| enabled | Estado operacional da flag |
| environment_id | Ambiente dono do valor |

Endpoint publico inicial:

```http
GET /public/sdk/:sdkKey/config
```

Critérios de aceite:

| Criterio |
|---|
| Dashboard cria flag |
| Dashboard edita valor por ambiente |
| Endpoint publico retorna JSON valido |
| SDK key invalida retorna 401 ou 404 |
| SDK key so acessa o ambiente correto |

## Fase 3 - Evaluation Engine

Objetivo: criar o motor de avaliacao local usado pelos SDKs.

Principios:

| Principio | Descricao |
|---|---|
| Local evaluation | Dados do usuario nao vao para a API |
| Determinismo | Mesmo usuario recebe o mesmo resultado |
| Top-down | Rules avaliadas em ordem |
| Fallback seguro | Erro retorna default informado pelo app |
| Compartilhado | Mesmo pacote usado por SDKs e testes |

User object:

```json
{
  "identifier": "123",
  "email": "user@example.com",
  "country": "BR",
  "custom": {
    "plan": "pro",
    "appVersion": "2.1.0"
  }
}
```

Comparadores iniciais:

| Comparador | Tipo |
|---|---|
| equals | string/number |
| notEquals | string/number |
| contains | string |
| startsWith | string |
| endsWith | string |
| oneOf | string/number |
| greaterThan | number |
| lessThan | number |
| semverGreaterThanOrEquals | semver |
| semverLessThan | semver |

Percentage rollout:

| Requisito | Descricao |
|---|---|
| Hash deterministico | Baseado em flag key + atributo do usuario |
| Sticky rollout | Mesmo usuario permanece no bucket |
| 0-100 | Bucket final entre 0 e 99 |
| Custom attribute | Rollout pode usar `identifier`, `email` ou custom attr |

Critérios de aceite:

| Criterio |
|---|
| `evaluate()` retorna valor correto sem rede |
| Rules sao avaliadas top-down |
| Rollout e deterministico |
| SemVer funciona para casos comuns |
| Testes cobrem matriz de comparadores |

## Fase 4 - JavaScript SDK

Objetivo: criar SDK utilizavel em Node, browser e React.

Pacotes:

| Pacote | Funcao |
|---|---|
| `@capture-flag/sdk-js` | SDK base |
| `@capture-flag/react` | Provider e hooks |
| `@capture-flag/evaluator` | Motor compartilhado |

API inicial:

```ts
const client = createClient({
  sdkKey: "sdk_xxx",
  baseUrl: "https://flags.example.com"
});

const enabled = await client.getValue("newCheckout", false, {
  identifier: "user-123",
  email: "user@example.com"
});
```

React:

```tsx
<CaptureFlagProvider client={client}>
  <App />
</CaptureFlagProvider>
```

```ts
const enabled = useFeatureFlag("newCheckout", false);
```

Critérios de aceite:

| Criterio |
|---|
| SDK busca config remoto |
| SDK avalia flags localmente |
| SDK tem cache em memoria |
| React hook funciona |
| Node/browser funcionam com o mesmo core |

## Fase 5 - Polling E Cache

Objetivo: tornar SDK resiliente e eficiente.

Modos:

| Modo | Comportamento |
|---|---|
| Auto polling | Atualiza config em intervalo |
| Lazy loading | Busca config quando cache expira |
| Manual refresh | App chama `refresh()` |
| Offline mode | Usa apenas cache local |

Caches:

| Cache | Uso |
|---|---|
| Memory cache | Padrao |
| localStorage | Browser |
| Custom cache | Futuro |

Critérios de aceite:

| Criterio |
|---|
| SDK funciona sem rede usando cache |
| Auto polling atualiza config |
| Manual refresh forca atualizacao |
| Lazy loading respeita TTL |

## Fase 6 - Segments

Objetivo: permitir segmentos reutilizaveis em regras.

Exemplos:

| Segmento | Condicao |
|---|---|
| beta-users | email termina com dominio especifico |
| admins | custom.role equals admin |
| enterprise | custom.plan equals enterprise |
| brazil | country equals BR |

Critérios de aceite:

| Criterio |
|---|
| Dashboard cria segmentos |
| Segmentos podem ser usados em targeting rules |
| Segmentos sao avaliados localmente pelo SDK |

## Fase 7 - Advanced Targeting

Objetivo: aproximar targeting de um sistema robusto de feature management.

Funcionalidades:

| Funcionalidade | Descricao |
|---|---|
| AND conditions | Multiplas condicoes na mesma rule |
| OR via rules | Varias rules em ordem |
| Prerequisite flags | Flag depende de outra flag |
| SemVer completo | Comparacoes de versao |
| Array contains | Condicoes sobre arrays |
| Date comparisons | BEFORE/AFTER |

Critérios de aceite:

| Criterio |
|---|
| Rules complexas sao previsiveis |
| Prerequisite flags detectam ciclos |
| Testes cobrem erro, ausencia de atributo e fallback |

## Fase 8 - Dashboard Melhorado

Objetivo: tornar o produto confortavel para uso diario.

Telas:

| Tela | Recursos |
|---|---|
| Flag list | Busca, filtros, tags, estado |
| Flag detail | Valores por ambiente, rules, rollout |
| Environment switcher | Alternancia rapida |
| SDK key panel | Copiar e rotacionar chave |
| JSON preview | Visualizar config gerado |
| Activity timeline | Historico da flag |

Critérios de aceite:

| Criterio |
|---|
| Usuario opera flags sem chamar API manual |
| Busca e filtros funcionam |
| Preview mostra o JSON entregue ao SDK |

## Fase 9 - Audit Logs

Objetivo: registrar alteracoes importantes.

Eventos:

| Evento |
|---|
| Flag criada |
| Flag alterada |
| Valor por ambiente alterado |
| Rule adicionada/removida |
| SDK key rotacionada |
| Segmento alterado |
| Usuario convidado/removido |

Critérios de aceite:

| Criterio |
|---|
| Alteracoes geram log imutavel |
| Logs mostram actor, timestamp, old value e new value |
| Dashboard exibe timeline |

## Fase 10 - RBAC

Objetivo: controlar permissoes por organizacao/projeto.

Roles iniciais:

| Role | Permissoes |
|---|---|
| owner | Tudo |
| admin | Gerencia projeto, usuarios e flags |
| developer | Cria e edita flags |
| viewer | Apenas leitura |

Permissoes:

| Permissao |
|---|
| read_flags |
| edit_flags |
| manage_segments |
| manage_environments |
| manage_sdk_keys |
| manage_members |
| manage_project |

Critérios de aceite:

| Criterio |
|---|
| Viewer nao edita |
| Developer nao gerencia usuarios |
| Admin gerencia projeto |
| Owner gerencia organizacao |

## Fase 11 - Config Versions

Objetivo: versionar configuracoes publicadas.

Recursos:

| Recurso | Descricao |
|---|---|
| Snapshot | JSON publicado por ambiente |
| Version number | Sequencial por projeto/ambiente |
| Diff | Comparacao entre versoes |
| Rollback | Restaurar versao anterior |

Critérios de aceite:

| Criterio |
|---|
| Toda publicacao gera versao |
| Usuario ve diff |
| Usuario restaura versao anterior |

## Fase 12 - Remote Config JSON

Objetivo: permitir valores JSON arbitrarios.

Tipos adicionais:

| Tipo |
|---|
| json_object |
| json_array |

Exemplo:

```json
{
  "theme": "dark",
  "maxUpload": 10,
  "enabledModules": ["checkout", "billing"]
}
```

Critérios de aceite:

| Criterio |
|---|
| Dashboard valida JSON |
| SDK retorna objeto tipado como unknown/generic |
| Config JSON publico preserva estrutura |

## Fase 13 - Integrations E Webhooks

Objetivo: notificar sistemas externos.

Eventos:

| Evento |
|---|
| flag.changed |
| flag.created |
| flag.archived |
| environment.changed |
| segment.changed |
| config.published |

Webhook:

| Recurso |
|---|
| URL |
| Metodo POST |
| Headers customizados |
| Secret HMAC |
| Retry |
| Logs de entrega |

Critérios de aceite:

| Criterio |
|---|
| Alteracao dispara webhook |
| Assinatura HMAC pode ser verificada |
| Falha gera retry |
| Slack pode receber mensagem via webhook |

## Fase 14 - Public Management API

Objetivo: permitir automacao externa.

Endpoints:

| Endpoint | Uso |
|---|---|
| `GET /api/projects` | Listar projetos |
| `POST /api/projects` | Criar projeto |
| `GET /api/flags` | Listar flags |
| `POST /api/flags` | Criar flag |
| `PATCH /api/flags/:id` | Atualizar flag |
| `GET /api/environments` | Listar ambientes |
| `GET /api/segments` | Listar segmentos |
| `POST /api/segments` | Criar segmento |

Requisitos:

| Requisito |
|---|
| API tokens |
| Scopes |
| Rate limit |
| OpenAPI |

Critérios de aceite:

| Criterio |
|---|
| API publica cobre CRUD principal |
| Tokens tem permissoes |
| Documentacao OpenAPI existe |

## Fase 15 - CLI

Objetivo: operar flags pelo terminal.

Comandos:

```bash
capture-flag login
capture-flag projects list
capture-flag flags list
capture-flag flags get newCheckout
capture-flag flags set newCheckout true --env production
capture-flag config pull --env production
```

Critérios de aceite:

| Criterio |
|---|
| CLI autentica com token |
| CLI lista e altera flags |
| CLI funciona em CI/CD |

## Fase 16 - Security

Objetivo: endurecer a plataforma.

Recursos:

| Recurso |
|---|
| Rotacao de SDK keys |
| Hash de tokens |
| Rate limit por SDK key |
| Rate limit por API token |
| Validacao de tenant em todas as queries |
| CORS configuravel |
| HTTPS obrigatorio em producao |
| Secrets fora do banco em texto puro quando necessario |

Critérios de aceite:

| Criterio |
|---|
| SDK key e somente leitura |
| API token pode ser revogado |
| Queries nao vazam dados entre organizacoes |

## Fase 17 - Enterprise

Objetivo: recursos para empresas maiores.

Recursos:

| Recurso |
|---|
| SSO/OIDC |
| SAML |
| SCIM |
| Domain verification |
| Mandatory change reason |
| Audit export |
| Permission groups customizados |

Critérios de aceite:

| Criterio |
|---|
| Organizacao consegue usar login corporativo |
| Provisionamento automatico funciona |
| Logs podem ser exportados |

## Fase 18 - Performance

Objetivo: escalar entrega de config.

Recursos:

| Recurso |
|---|
| Config JSON pre-computado |
| ETag |
| Cache-Control |
| gzip |
| brotli |
| CDN/edge cache |
| Metricas de download |
| Redis opcional para configs publicados |

Critérios de aceite:

| Criterio |
|---|
| Endpoint publico nao monta JSON a cada request |
| Respostas 304 funcionam com ETag |
| Config downloads sao contabilizados |

## Fase 19 - OpenFeature

Objetivo: compatibilidade com padrao OpenFeature.

Recursos:

| Recurso |
|---|
| Provider JavaScript |
| Evaluation context mapping |
| Boolean/string/number/object support |
| Metadata de avaliacao |

Critérios de aceite:

| Criterio |
|---|
| Usuario consegue usar OpenFeature SDK |
| Provider usa nosso SDK internamente |

## Fase 20 - Mobile SDKs

Objetivo: expandir plataformas.

Ordem sugerida:

| SDK | Prioridade |
|---|---|
| React Native | Alta |
| Flutter | Media |
| Android Kotlin | Media |
| iOS Swift | Media |

Critérios de aceite:

| Criterio |
|---|
| Mesmos testes de avaliacao passam em todos os SDKs |
| Cache local funciona |
| Offline mode funciona |

## Fase 21 - Documentation

Objetivo: facilitar adocao.

Docs:

| Documento |
|---|
| Quickstart React |
| Quickstart Node |
| Quickstart Browser |
| SDK reference |
| API reference |
| Concepts |
| Targeting guide |
| Rollout guide |
| Self-host guide |

Critérios de aceite:

| Criterio |
|---|
| Usuario integra primeira flag em menos de 10 minutos |
| Exemplos funcionam localmente |

## Fase 22 - Billing

Objetivo: habilitar SaaS comercial.

Recursos:

| Recurso |
|---|
| Planos |
| Stripe |
| Usage metering |
| Limite de flags |
| Limite de projetos |
| Limite de ambientes |
| Limite de config downloads |
| Seats |
| Add-ons |

Critérios de aceite:

| Criterio |
|---|
| Organizacao tem plano |
| Uso e medido |
| Limites sao aplicados |
| Stripe gerencia assinatura |

## MVP Real

O MVP deve ser uma fatia vertical funcional.

| Marco | Entrega |
|---|---|
| MVP 1 | OAuth, organization, project, environments |
| MVP 2 | SDK keys e endpoint publico de config |
| MVP 3 | CRUD de boolean flags |
| MVP 4 | Valores por ambiente |
| MVP 5 | JS SDK com fetch, cache e evaluate |
| MVP 6 | Targeting simples |
| MVP 7 | Percentage rollout |
| MVP 8 | Dashboard basico usavel |

## Ordem Recomendada De Execucao

1. Criar monorepo TypeScript com npm workspaces.
2. Subir API NestJS com Postgres.
3. Implementar OAuth com GitHub e sessao em cookie HTTP-only.
4. Criar organizations, projects e environments.
5. Implementar SDK keys.
6. Criar CRUD de flags.
7. Gerar config JSON publico.
8. Criar evaluator compartilhado.
9. Criar SDK JS.
10. Criar dashboard operacional.
11. Implementar targeting.
12. Implementar rollout percentual.
13. Adicionar cache/polling no SDK.
14. Adicionar audit logs.
15. Evoluir RBAC.

## Decisoes Pendentes

Nao ha decisoes tecnicas bloqueantes pendentes para iniciar a Sprint 1.

| Decisao futura | Momento ideal |
|---|---|
| Adicionar Google OAuth | Depois do fluxo GitHub estar estavel |
| Definir cloud provider | Antes do primeiro deploy externo |
| Definir estrategia de billing | Antes da Fase 22 |
| Definir Redis obrigatorio ou opcional | Antes da Fase 18 |
