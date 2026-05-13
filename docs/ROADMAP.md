# Roadmap - Capture Flag

Este documento descreve as fases de evolucao do produto. Contexto de produto, decisoes tecnicas, formato de config e modelo de dados ficam em documentos separados.

| Documento | Conteudo |
|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Objetivo, principios, termos e modelo SaaS multi-tenant |
| [`TECHNICAL_DECISIONS.md`](TECHNICAL_DECISIONS.md) | Stack, decisoes fechadas, modelo inicial e decisoes futuras |
| [`CONFIG_FORMAT.md`](CONFIG_FORMAT.md) | Config JSON publico, schema versionado e cache HTTP |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Modelo relacional, constraints e invariantes |
| [`EXECUTION_PLAN.md`](EXECUTION_PLAN.md) | Ordem inicial de implementacao do MVP |

## Fase 1 - Fundacao

Objetivo: criar a base minima para autenticar usuarios, criar organizacoes, membros, projetos, configs, roles por projeto, ambientes e SDK keys.

Status: implementada como fundacao inicial no monorepo. A UI e operacional, mas ainda simples; polimento visual e componentes shadcn/ui ficam para evolucoes posteriores.

Entregas:

| Area | Entrega |
|---|---|
| Monorepo | Estrutura `apps/api`, `apps/client`, `packages/shared`, `packages/sdk-js`, `packages/evaluator` |
| API | NestJS inicial com healthcheck, config env e conexao PostgreSQL |
| Banco | Migrations iniciais |
| Auth | OAuth inicial com GitHub e sessoes opacas em cookie HTTP-only |
| Organization | Criar, listar e selecionar organizacao |
| Organization Members | Suportar N usuarios por organizacao com roles como owner, admin, member e viewer |
| Project | CRUD basico de projetos |
| Project Members | Suportar N usuarios por projeto com roles como project_admin, developer e viewer |
| Config | Criar configs dentro de um projeto |
| Environment | Criar ambientes por projeto |
| SDK Keys | Gerar chave publica por config/ambiente |
| Tenant isolation | Guards/servicos devem validar organizacao, membership e role em todas as rotas privadas |
| Client | Login, seletor de organizacao, projeto, config e ambiente |

Criterios de aceite:

| Criterio |
|---|
| Usuario consegue entrar via OAuth |
| Sessao e criada com cookie HTTP-only e token armazenado como hash no banco |
| Usuario consegue criar uma organizacao |
| Usuario owner consegue adicionar membros na organizacao |
| Usuario owner/admin consegue conceder roles por projeto |
| Usuario consegue criar um projeto |
| Usuario consegue criar uma config dentro do projeto |
| Usuario consegue criar ambientes |
| Usuario consegue copiar uma SDK key |
| Usuario nao consegue acessar recursos de outra organizacao |

## Fase 2 - Feature Flags Core

Objetivo: permitir criacao e entrega publica de flags/settings simples dentro de uma config.

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
| config_id | Config dona da flag |
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

Valor por ambiente (`feature_flag_environment_values`):

| Campo | Descricao |
|---|---|
| project_id | Denormalizacao para tenant, constraints e queries |
| config_id | Config dona da flag |
| feature_flag_id | Flag dona deste valor |
| environment_id | Ambiente dono do valor |
| default_value | Valor servido quando nenhuma rule casa |
| rules_json | Regras de targeting em JSONB no MVP |
| percentage_attribute | Atributo usado para rollout percentual, padrao `identifier` |
| percentage_options_json | Rollout percentual em JSONB no MVP |
| updated_by_user_id | Usuario que alterou o valor |

Restricoes obrigatorias:

| Restricao |
|---|
| `feature_flag_environment_values` deve ter unicidade por `(feature_flag_id, environment_id)` |
| `feature_flag_id`, `config_id` e `environment_id` devem pertencer ao mesmo projeto |
| Flags booleanas usam `default_value` como liga/desliga; nao existe campo `enabled` separado no MVP |
| Toda alteracao relevante deve incrementar a revisao do par `config + environment` |

Cache HTTP no endpoint publico:

| Recurso | Comportamento |
|---|---|
| `revision` | Numero inteiro incrementado a cada alteracao da config no ambiente |
| `ETag` | Header derivado da revisao ou do conteudo gerado |
| `Cache-Control` | Header configuravel para permitir cache seguro no SDK/CDN |
| `If-None-Match` | Requisicoes sem mudanca retornam `304 Not Modified` |

Audit minimo no MVP:

| Evento |
|---|
| Flag criada |
| Flag metadata alterada |
| Valor por ambiente alterado |
| SDK key criada ou revogada |

Endpoint publico inicial:

```http
GET /public/sdk/:sdkKey/config
```

Criterios de aceite:

| Criterio |
|---|
| Client cria flag |
| Client edita valor por ambiente |
| Endpoint publico retorna JSON valido |
| SDK key invalida retorna 401 ou 404 |
| SDK key so acessa a config e o ambiente corretos |
| Config JSON publico retorna apenas flags da config/ambiente da SDK key |
| Endpoint publico retorna `ETag` e `Cache-Control` |
| Endpoint publico retorna `304 Not Modified` quando `If-None-Match` casa |
| Alterar flag no client incrementa a revisao da config/ambiente |

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

Formato inicial de `rules_json`:

```json
[
  {
    "conditions": [
      {
        "attribute": "country",
        "operator": "equals",
        "value": "BR"
      }
    ],
    "serve": true
  }
]
```

Formato inicial de `percentage_options_json`:

```json
[
  { "percentage": 20, "value": true },
  { "percentage": 80, "value": false }
]
```

O atributo usado para bucket fica em `percentage_attribute` no valor por ambiente. O padrao e `identifier`.

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
| Missing attribute | Se o atributo de rollout nao existir, avaliacao cai para o proximo fallback definido |

Criterios de aceite:

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

Criterios de aceite:

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

Criterios de aceite:

| Criterio |
|---|
| SDK funciona sem rede usando cache |
| Auto polling atualiza config |
| Manual refresh forca atualizacao |
| Lazy loading respeita TTL |
| SDK envia `If-None-Match` quando tiver ETag em cache |
| SDK trata `304 Not Modified` sem reprocessar config |

## Fase 6 - Segments

Objetivo: permitir segmentos reutilizaveis em regras.

Exemplos:

| Segmento | Condicao |
|---|---|
| beta-users | email termina com dominio especifico |
| admins | custom.role equals admin |
| enterprise | custom.plan equals enterprise |
| brazil | country equals BR |

Criterios de aceite:

| Criterio |
|---|
| Client cria segmentos |
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

Criterios de aceite:

| Criterio |
|---|
| Rules complexas sao previsiveis |
| Prerequisite flags detectam ciclos |
| Testes cobrem erro, ausencia de atributo e fallback |

## Fase 8 - Client Melhorado

Objetivo: tornar o produto confortavel para uso diario.

Telas:

| Tela | Recursos |
|---|---|
| Flag list | Busca, filtros, tags e estado |
| Flag detail | Valores por ambiente, rules, rollout |
| Project members | Gerenciar membros e roles do projeto |
| Config switcher | Alternancia entre configs do projeto |
| Environment switcher | Alternancia rapida |
| SDK key panel | Copiar e rotacionar chave |
| JSON preview | Visualizar config gerado |
| Activity timeline | Historico da flag |

Criterios de aceite:

| Criterio |
|---|
| Usuario opera flags sem chamar API manual |
| Busca e filtros funcionam |
| Usuario filtra flags por tags |
| Preview mostra o JSON entregue ao SDK |

## Fase 9 - Audit Logs Avancados

Objetivo: evoluir o audit minimo do MVP para uso diario, compliance e investigacao.

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
| Config publicada |

Recursos avancados:

| Recurso |
|---|
| Timeline por flag |
| Filtros por actor, entidade e periodo |
| Mandatory change reason |
| Retencao configuravel por plano futuro |
| Export futuro |

Criterios de aceite:

| Criterio |
|---|
| Alteracoes continuam gerando log imutavel |
| Logs mostram actor, timestamp, old value e new value |
| Client exibe timeline |
| Mudancas criticas podem exigir motivo |

## Fase 10 - RBAC

Objetivo: controlar permissoes por organizacao e projeto.

Roles de organizacao:

| Role | Permissoes |
|---|---|
| owner | Acesso total a organizacao, projetos, membros e billing futuro |
| admin | Gerencia membros e projetos da organizacao |
| member | Pode acessar projetos onde recebeu role |
| viewer | Leitura basica da organizacao |

Roles de projeto:

| Role | Permissoes |
|---|---|
| project_admin | Gerencia membros, configs, ambientes, SDK keys e flags do projeto |
| developer | Cria, edita e remove flags do projeto |
| viewer | Apenas leitura no projeto |

Exemplo de uso:

| Usuario | Role |
|---|---|
| Dono da empresa | owner na organizacao |
| Lead API | developer no projeto Backend API |
| Lead Frontend | developer no projeto Frontend Web |

Permissoes:

| Permissao |
|---|
| create_project |
| read_project |
| update_project |
| delete_project |
| manage_configs |
| create_flag |
| read_flag |
| update_flag |
| delete_flag |
| manage_segments |
| manage_environments |
| manage_sdk_keys |
| manage_members |
| manage_roles |

Criterios de aceite:

| Criterio |
|---|
| Viewer nao edita |
| Developer nao gerencia usuarios |
| Project admin gerencia apenas projetos onde recebeu essa role |
| Developer edita apenas flags dos projetos onde recebeu essa role |
| Owner gerencia organizacao |
| Usuario sem role no projeto nao acessa flags daquele projeto |

## Fase 11 - Config Versions

Objetivo: adicionar historico, diff e rollback sobre a revisao basica ja existente no MVP.

Recursos:

| Recurso | Descricao |
|---|---|
| Snapshot | JSON publicado por config/ambiente |
| Version number | Sequencial por config/ambiente |
| Diff | Comparacao entre versoes |
| Rollback | Restaurar versao anterior |

Criterios de aceite:

| Criterio |
|---|
| Toda publicacao gera snapshot historico |
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

Criterios de aceite:

| Criterio |
|---|
| Client valida JSON |
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

Criterios de aceite:

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
| `GET /api/projects/:id/configs` | Listar configs do projeto |
| `POST /api/projects/:id/configs` | Criar config |
| `GET /api/organizations/:id/members` | Listar membros da organizacao |
| `POST /api/organizations/:id/members` | Convidar membro para organizacao |
| `GET /api/projects/:id/members` | Listar membros do projeto |
| `POST /api/projects/:id/members` | Conceder role em projeto |
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

Criterios de aceite:

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
capture-flag configs list --project ecommerce
capture-flag flags list
capture-flag flags get newCheckout
capture-flag flags set newCheckout true --config frontend-web --env production
capture-flag config pull --config frontend-web --env production
```

Criterios de aceite:

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
| Validacao de role por projeto em rotas de configs, flags, ambientes e SDK keys |
| CORS configuravel |
| HTTPS obrigatorio em producao |
| Secrets fora do banco em texto puro quando necessario |

Criterios de aceite:

| Criterio |
|---|
| SDK key e somente leitura |
| API token pode ser revogado |
| Queries nao vazam dados entre organizacoes |
| Usuario sem role adequada nao altera recursos de projeto |
| SDK key revogada nao acessa config publica |

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

Criterios de aceite:

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
| gzip |
| brotli |
| CDN/edge cache |
| Metricas de download |
| Redis opcional para configs publicadas |

Criterios de aceite:

| Criterio |
|---|
| Endpoint publico nao monta JSON a cada request |
| Cache HTTP basico do MVP continua funcionando atras de CDN |
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

Criterios de aceite:

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

Criterios de aceite:

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

Criterios de aceite:

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
| Limite de configs |
| Limite de ambientes |
| Limite de config downloads |
| Seats |
| Add-ons |

Criterios de aceite:

| Criterio |
|---|
| Organizacao tem plano |
| Uso e medido |
| Limites sao aplicados |
| Stripe gerencia assinatura |
