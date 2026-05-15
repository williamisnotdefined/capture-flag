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

Status: implementada como fatia core inicial, incluindo CRUD de flags, valores por ambiente, endpoint publico cacheavel e audit minimo para flags e SDK keys.

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
| deleted_at | Exclusao logica |

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

Escopo: esta fase fica restrita ao pacote `@capture-flag/evaluator`. Ela entrega o
motor local de avaliacao e seus testes. O consumo deste motor pelo
`@capture-flag/sdk-js`, incluindo fetch do Config JSON, cache, polling e API
`getValue()`, pertence as Fases 4 e 5.

Status: implementada no pacote `@capture-flag/evaluator`, com contrato de
`evaluate()`, rules top-down, matriz inicial de comparadores, SemVer basico,
rollout percentual deterministico e testes unitarios.

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

Decisoes:

| Decisao | Valor |
|---|---|
| Modo padrao | Lazy loading |
| Encerramento de polling | `client.close()` |
| React auto-update | Fora da Fase 5 |

API esperada:

```ts
const client = createClient({
  sdkKey: "sdk_xxx",
  baseUrl: "https://flags.example.com",
  mode: "lazy",
  cacheTtlMs: 60_000
});

await client.refresh();
client.close();
```

Modos:

| Modo | Comportamento |
|---|---|
| Lazy loading | Padrao. Busca config quando nao ha cache ou quando cache expira |
| Auto polling | Atualiza config em intervalo em background |
| Manual refresh | Usa cache atual e app chama `refresh()` para atualizar |
| Offline mode | Usa apenas cache local |

Caches:

| Cache | Uso |
|---|---|
| Memory cache | Padrao |
| localStorage | Browser, opt-in |
| Custom cache | Futuro |

Notas:

| Nota |
|---|
| SDK nao deve armazenar a raw SDK key em cache persistente |
| SDK deve reaproveitar cache valido quando refresh falhar |
| Config invalida nao substitui cache valido existente |
| `@capture-flag/react` continua camada fina sobre o SDK JS |
| Polling atualiza o cache do SDK, mas o hook React nao re-renderiza automaticamente nesta fase |

Criterios de aceite:

| Criterio |
|---|
| SDK funciona sem rede usando cache |
| Auto polling atualiza config |
| Manual refresh forca atualizacao |
| Lazy loading respeita TTL |
| SDK envia `If-None-Match` quando tiver ETag em cache |
| SDK trata `304 Not Modified` sem reprocessar config |
| `client.close()` encerra polling em background |

## Fase 5.1 - React SDK Live Updates

Status: implementada.

Objetivo: fazer apps React refletirem mudancas de config sem depender de novo render externo.

Recursos:

| Recurso | Descricao |
|---|---|
| SDK subscriptions | Client expõe evento ou assinatura para mudancas de config |
| React live updates | `useFeatureFlag` re-renderiza quando config do SDK muda |
| Polling integration | Auto polling notifica apenas quando a config muda |
| Cleanup | Provider e hooks removem assinaturas corretamente |

Criterios de aceite:

| Criterio |
|---|
| Hook React atualiza valor apos polling mudar config |
| Hook React continua retornando fallback no render inicial |
| Subscriptions nao vazam apos unmount |
| Contexto de avaliacao continua local ao React/SDK |

## Fase 6 - Segments

Objetivo: permitir segmentos reutilizaveis em regras.

Decisoes de implementacao:

| Decisao | Motivo |
|---|---|
| Segmentos escopados por config | Mantem o recurso alinhado ao Config JSON consumido por SDKs |
| Referencia por condition `{ "segment": "key" }` | Reusa a estrutura atual de targeting rules |
| Avaliacao local | Preserva a privacidade do Evaluation Context |
| Sem segmentos aninhados | Evita ciclos; composicao avancada fica fora da Fase 6 |

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
| Alteracao de segmento atualiza revision e ETag do Config JSON |

## Fase 7 - Advanced Targeting

Objetivo: aproximar targeting de um sistema robusto de feature management.

Status: implementada com operadores avancados no evaluator/SDK, validacao de API/client e prerequisites locais entre flags.

Decisoes de implementacao:

| Decisao | Motivo |
|---|---|
| `AND` por conditions | Ja e o comportamento de uma rule: todas as conditions precisam casar |
| `OR` por rules ordenadas | Ja e o comportamento top-down: a primeira rule que casa vence |
| Prerequisite por condition | Usa `{ "prerequisiteFlag": "flag-key", "operator": "equals", "value": true }` sem mudar schemaVersion |
| Prerequisite restrito a `equals`/`notEquals` | Mantem dependencias previsiveis e tipadas nesta fase |
| Ciclos rejeitados na API e seguros no evaluator | Evita salvar grafo invalido e protege SDKs contra config malformada |
| SemVer 2.0.0 no evaluator | Prerelease passa a respeitar precedencia SemVer; build metadata e ignorado |
| Sem migration | `rules_json` e `conditions_json` continuam JSONB |

Funcionalidades:

| Funcionalidade | Descricao |
|---|---|
| AND conditions | Multiplas condicoes na mesma rule |
| OR via rules | Varias rules em ordem |
| Prerequisite flags | Flag depende de outra flag avaliada localmente |
| SemVer completo | `semverEquals`, `semverGreaterThan`, `semverGreaterThanOrEquals`, `semverLessThan` e `semverLessThanOrEquals` |
| Array contains | `arrayContains` para atributos array no Evaluation Context |
| Date comparisons | `dateBefore` e `dateAfter` com ISO date string ou timestamp |

Criterios de aceite:

| Criterio |
|---|
| Rules complexas sao previsiveis |
| Prerequisite flags detectam ciclos |
| Testes cobrem erro, ausencia de atributo e fallback |
| SDK nao envia Evaluation Context para API ao avaliar prerequisites |
| Public Config JSON continua `schemaVersion: 1` |

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
| Membro adicionado/alterado/removido |
| Config publicada |

Recursos avancados:

| Recurso |
|---|
| Timeline por flag |
| Filtros por actor, entidade e periodo |
| Logs automaticos sem input obrigatorio do usuario |
| Retencao configuravel por plano futuro |
| Export futuro |

Criterios de aceite:

| Criterio |
|---|
| Alteracoes continuam gerando log imutavel |
| Logs mostram actor, timestamp, old value e new value |
| Client exibe timeline |
| Nenhum audit log exige campo manual obrigatorio para ser gerado |

## Fase 10 - RBAC

Objetivo: controlar permissoes por organizacao e projeto.

Status: implementada com matriz RBAC centralizada na API, gates no client para UX, gestao completa de membros de organizacao/projeto e testes de acesso. Roles `owner` e `admin` da organizacao continuam podendo satisfazer acesso de projeto sem membership explicito; `member` e `viewer` precisam de role no projeto para acessar recursos do projeto.

Roles de organizacao:

| Role | Permissoes |
|---|---|
| owner | Acesso total a organizacao, projetos, membros e billing futuro |
| admin | Gerencia membros e projetos da organizacao, exceto criar, alterar ou remover owners |
| member | Pode acessar projetos onde recebeu role |
| viewer | Leitura basica da organizacao |

Roles de projeto:

| Role | Permissoes |
|---|---|
| project_admin | Gerencia membros, configs, ambientes, SDK keys, segmentos e flags do projeto |
| developer | Cria, edita e remove flags do projeto |
| viewer | Apenas leitura no projeto |

Exemplo de uso:

| Usuario | Role |
|---|---|
| Dono da empresa | owner na organizacao |
| Lead API | developer no projeto Backend API |
| Lead Frontend | developer no projeto Frontend Web |

Permissoes:

| Permissao | Roles autorizadas |
|---|---|
| create_project | organization `owner`, organization `admin` |
| read_project | organization `owner`, organization `admin`, project `project_admin`, project `developer`, project `viewer` |
| update_project | organization `owner`, organization `admin`, project `project_admin` |
| delete_project | organization `owner`, organization `admin`, project `project_admin` |
| manage_configs | organization `owner`, organization `admin`, project `project_admin` |
| create_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer` |
| read_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer`, project `viewer` |
| update_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer` |
| delete_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer` |
| manage_segments | organization `owner`, organization `admin`, project `project_admin` |
| manage_environments | organization `owner`, organization `admin`, project `project_admin` |
| manage_sdk_keys | organization `owner`, organization `admin`, project `project_admin` |
| manage_members | organization `owner`, organization `admin` para membros da organizacao, com owner reservado a owner; organization `owner`, organization `admin`, project `project_admin` para membros do projeto |
| manage_roles | organization `owner`, organization `admin` para roles da organizacao, com owner reservado a owner; organization `owner`, organization `admin`, project `project_admin` para roles do projeto |

Criterios de aceite:

| Criterio |
|---|
| Viewer nao edita |
| Developer nao gerencia usuarios |
| Project admin gerencia apenas projetos onde recebeu essa role |
| Developer edita apenas flags dos projetos onde recebeu essa role |
| Owner gerencia organizacao |
| Usuario sem role no projeto nao acessa flags daquele projeto |

## Fase 11 - Remote Config JSON

Objetivo: permitir valores JSON arbitrarios.

Status: implementada para `json_object` e `json_array`, preservando `schemaVersion: 1` e avaliacao local no SDK.

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
| Prerequisites continuam restritos a flags primitivas |

## Fase 12 - Integrations E Webhooks

Status: Removida do MVP.

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

## Fase 13 - Public Management API

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
| `GET /api/configs/:id/segments` | Listar segmentos da config |
| `POST /api/configs/:id/segments` | Criar segmento na config |
| `PATCH /api/configs/:id/segments/:segmentId` | Atualizar segmento |
| `DELETE /api/configs/:id/segments/:segmentId` | Remover segmento |

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

## Fase 14 - CLI

Status: Removida do MVP.

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

## Fase 15 - Security

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

## Fase 16 - Enterprise

Status: Removida do MVP.

Objetivo: recursos para empresas maiores.

Recursos:

| Recurso |
|---|
| SSO/OIDC |
| SAML |
| SCIM |
| Domain verification |
| Audit export |
| Permission groups customizados |

Criterios de aceite:

| Criterio |
|---|
| Organizacao consegue usar login corporativo |
| Provisionamento automatico funciona |
| Logs podem ser exportados |

## Fase 17 - Performance

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

## Fase 18 - OpenFeature

Status: Removida do MVP.

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

## Fase 19 - Mobile SDKs

Status: Removida do MVP.

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

## Fase 20 - Documentation

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

## Fase 21 - Billing

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
