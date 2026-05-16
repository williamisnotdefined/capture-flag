# Plano De E2E - Capture Flag

## Objetivo

Criar uma estrategia incremental de testes end-to-end para validar que o sistema funciona com alto nivel de confianca, sem tentar provar "100%" de corretude.

E2E aqui significa testar a aplicacao real rodando contra banco real de teste. Como a interface ainda deve mudar bastante, a primeira fase deve priorizar API, contratos publicos e fluxos de produto usando banco real. Testes de browser pela UI entram de forma pequena no inicio e crescem quando a interface estabilizar.

## Decisoes

| Area | Decisao |
|---|---|
| Local dos testes | Criar workspace `apps/e2e` |
| Runner | Playwright |
| Primeira prioridade | E2E/API + banco real |
| Browser E2E inicial | Smoke e golden path minimo |
| Banco | Postgres dedicado para E2E |
| Auth nos testes | Sessao criada direto no banco, sem GitHub OAuth real |
| Paralelismo inicial | `workers: 1` para evitar conflito de dados |
| Dados | Reset + fixtures/factories por suite |

## Estrutura Proposta

```text
apps/e2e/
  package.json
  playwright.config.ts
  tests/
    00-smoke.spec.ts
    01-auth.spec.ts
    02-golden-path.spec.ts
    organizations.spec.ts
    projects.spec.ts
    environments.spec.ts
    configs.spec.ts
    feature-flags.spec.ts
    segments.spec.ts
    sdk-keys.spec.ts
    public-sdk.spec.ts
    api-tokens.spec.ts
    management-api.spec.ts
    audit-logs.spec.ts
    tenant-access.spec.ts
  support/
    api.ts
    auth.ts
    db.ts
    fixtures.ts
    ids.ts
    reset.ts
    seed.ts
```

## Banco E2E

Banco separado do desenvolvimento local:

```text
DATABASE_URL="postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public"
E2E_POSTGRES_PORT=55433
```

O ideal e ter um arquivo de ambiente proprio, como `.env.e2e`, ou scripts que injetem `DATABASE_URL` explicitamente. O runner de E2E nunca deve depender da `.env` local de desenvolvimento.

Estrategia inicial:

| Necessidade | Como fazer |
|---|---|
| Isolar dev de E2E | Rodar Postgres E2E em porta separada |
| Estado limpo | Truncar tabelas antes de cada suite ou teste critico |
| Schema atualizado | Rodar Prisma migrations antes da suite |
| Usuario logado | Criar `users` e `sessions` direto no banco |
| Dados simples | Criar via API quando o teste quer validar fluxo |
| Dados complexos | Criar via fixture/factory direta no banco |
| Execucao confiavel | Comecar com `workers: 1` |

Depois, se a suite ficar lenta, podemos evoluir para banco/schema por worker.

## Estrategia De Auth

Nao usar GitHub OAuth real nos E2E principais.

Fluxo recomendado:

1. Criar usuario no banco.
2. Criar session com `tokenHash` calculado como a API faz.
3. Setar cookie `cf_session` no contexto Playwright ou enviar `Cookie` nas chamadas API.
4. Validar `/api/v1/auth/me` para confirmar a sessao.

GitHub OAuth pode ter no maximo um teste separado, manual ou mockado, se um dia for necessario. Ele nao deve bloquear a suite principal.

## Camadas De Teste

| Camada | Objetivo | Quando usar |
|---|---|---|
| Unit/Service | Regras pequenas e invariantes | Ja existe com Vitest |
| API E2E | Rotas reais + banco real | Prioridade agora |
| Contract E2E | Config JSON, SDK key, ETag, Management API | Prioridade agora |
| Browser E2E | Fluxos criticos pela UI | Poucos testes agora, ampliar depois |
| Data-heavy E2E | Banco populado com muitos dados | Depois da base estar estavel |

## Roadmap

### Fase 0 - Documento E Planejamento

Objetivo: alinhar estrategia antes de implementar.

Entregaveis:

- `docs/E2E_PLAN.md`.
- Matriz de cobertura das rotas atuais.
- Plano de banco dedicado.
- Ordem de implementacao por risco.

### Fase 1 - Infra Minima

Objetivo: provar que o ambiente E2E sobe e consegue falar com API, client e banco.

Entregaveis:

- Workspace `apps/e2e`.
- Playwright configurado.
- Banco E2E separado.
- Scripts de reset e seed minimo.
- Helper para criar usuario e sessao.
- Smoke tests.

Casos:

| Caso | Resultado esperado |
|---|---|
| `GET /health` | Retorna `{ ok: true, service: "capture-flag-api" }` |
| Client carrega | App responde no browser |
| `/api/v1/auth/me` com sessao valida | Retorna usuario e organizacoes |
| `/api/v1/auth/me` sem sessao | Retorna `401` |
| Logout | Invalida sessao e limpa acesso posterior |

### Fase 2 - Golden Path API/Contrato

Objetivo: validar a fatia vertical principal do produto sem depender da UI.

Fluxo:

1. Criar usuario autenticado.
2. Criar organizacao.
3. Criar projeto.
4. Criar ambiente.
5. Criar config.
6. Criar feature flag booleana.
7. Atualizar valor da flag no ambiente.
8. Consultar preview da config.
9. Criar SDK key.
10. Consultar config publica por SDK key.
11. Validar `ETag` e `304 Not Modified`.
12. Avaliar flag com `@capture-flag/evaluator` ou `@capture-flag/sdk-js`.

Resultado esperado:

- A flag criada aparece na config publica.
- O valor por ambiente bate com o valor atualizado.
- A revisao/ETag muda quando a config muda.
- O SDK/evaluator retorna o valor esperado.

### Fase 3 - Cobertura Das Rotas Privadas

Objetivo: cobrir a maioria dos casos de uso atuais via API real.

Prioridade alta:

| Area | Rotas/casos |
|---|---|
| Organizations | `GET /api/v1/organizations`, `POST /api/v1/organizations`, `GET /api/v1/organizations/:organizationId` |
| Organization members | listar, adicionar, atualizar role, remover |
| Projects | listar por organizacao, criar, obter, editar, deletar |
| Project members | listar, adicionar, atualizar role, remover |
| Environments | listar, criar, editar, deletar |
| Configs | listar, criar, deletar |
| Feature flags | listar, criar, editar metadata, arquivar/deletar |
| Feature flag values | atualizar valor por ambiente |
| Feature flag activity | listar atividade da flag |
| Segments | listar, criar, editar, deletar |
| SDK keys | listar, criar, rotacionar, revogar |
| Audit logs | listar e filtrar logs gerados por acoes importantes |

Prioridade media:

| Area | Casos |
|---|---|
| Validacao | payload invalido retorna erro correto |
| UUID params | UUID invalido retorna erro de validacao |
| Unicidade | slugs, config keys, environment keys, flag keys e segment keys ativos |
| Soft delete | flag/segment arquivado sai das listagens ativas e config publica |
| Paginacao | cursors/limits em audit logs e activity |

### Fase 4 - Contratos Publicos E SDK

Objetivo: garantir que consumidores externos nao quebrem.

Casos:

| Area | Caso |
|---|---|
| Public SDK config | `GET /public-api/v1/sdk/:sdkKey/config` retorna Config JSON valido |
| SDK key invalida | Retorna erro esperado sem vazar dados |
| SDK key revogada | Nao retorna config |
| ETag | Segunda chamada com `If-None-Match` retorna `304` |
| Cache headers | `ETag` e `Cache-Control` presentes |
| Config preview | Preview autenticado bate com config publica do mesmo par config+environment |
| Flag arquivada | Nao aparece no Config JSON |
| Segment arquivado | Nao aparece no Config JSON |
| Targeting rules | Rules validas aparecem normalizadas |
| Percentage rollout | Options somam 100 e sao emitidas corretamente |
| Prerequisite flags | Referencias validas aparecem e referencias invalidas falham |
| SDK JS | `createClient().getValue()` busca config real e avalia valor esperado |

### Fase 5 - Seguranca E Tenant Access

Objetivo: pegar bugs perigosos de acesso e isolamento.

Casos:

| Area | Caso |
|---|---|
| Sessao ausente | Rotas privadas retornam `401` |
| Sessao invalida/revogada | Retorna `401` e limpa cookie quando aplicavel |
| Logout | Sessao revogada nao acessa `/auth/me` |
| Tenant isolation | Usuario de org A nao acessa org/projeto/config de org B |
| Organization roles | `member`/`viewer` nao gerenciam membros quando nao permitido |
| Project roles | `viewer` nao gerencia flags, segmentos ou recursos administrativos |
| Org owner/admin | Pode satisfazer acesso de projeto conforme contrato atual |
| Project admin | Gerencia recursos administrativos do projeto |
| Developer | Gerencia feature flags conforme contrato atual |
| Segment manager | Apenas roles permitidas gerenciam segments |

### Fase 6 - API Tokens E Management API

Objetivo: validar automacao externa e scopes.

Casos de API tokens:

| Caso | Resultado esperado |
|---|---|
| Criar token organizacional | Retorna token bruto uma unica vez e prefixo persistido |
| Listar tokens | Nao retorna segredo bruto |
| Revogar token | Token deixa de autenticar |
| Token expirado | Nao autentica |
| Token project-scoped | Nao acessa recursos de outro projeto |
| Scope insuficiente | Retorna `403` |
| Token ausente/invalido | Retorna `401` |

Casos da Management API:

| Rota | Casos |
|---|---|
| `GET /api/v1/projects` | lista projetos do token conforme tenant |
| `POST /api/v1/projects` | cria projeto quando token permite |
| `GET /api/v1/flags?configId=` | lista flags com `flags:read` |
| `POST /api/v1/flags` | cria flag com `flags:write` |
| `PATCH /api/v1/flags/:id` | atualiza flag com tenant correto |
| `GET /api/v1/environments?projectId=` | lista ambientes com `environments:read` |

### Fase 7 - Browser E2E

Objetivo: validar que os fluxos criticos funcionam pela interface.

Como a UI ainda vai mudar, comecar pequeno.

Casos iniciais:

| Fluxo | Resultado esperado |
|---|---|
| Login fake/session | Usuario autenticado chega em `/organizations` |
| Criar organizacao | Organizacao aparece selecionavel |
| Criar projeto | Projeto aparece e navega corretamente |
| Criar environment/config | Recursos aparecem no contexto do projeto |
| Criar feature flag | Flag aparece na lista |
| Atualizar valor | Preview/config publica reflete a mudanca |
| Criar SDK key | Chave bruta aparece uma vez e lista mostra prefixo/status |

Regras para browser tests:

- Usar seletores estaveis quando possivel.
- Evitar testar detalhes visuais enquanto a interface estiver mudando.
- Preferir validar comportamento observavel e chamadas/resultados reais.
- Manter poucos testes longos; adicionar mais somente quando fluxo estabilizar.

### Fase 8 - Banco Populado E Dados Complexos

Objetivo: testar funcoes que precisam de muitos dados e estados realistas.

Fixtures sugeridas:

| Fixture | Conteudo |
|---|---|
| `smallWorkspace` | 1 org, 1 user, 1 project, 1 config, 2 environments |
| `flagWorkspace` | smallWorkspace + varias flags de todos os tipos |
| `targetingWorkspace` | flags com rules, segments, prerequisites e rollouts |
| `rbacWorkspace` | varios usuarios com roles diferentes |
| `tokenWorkspace` | API tokens org-scoped, project-scoped, revogados e expirados |
| `largeWorkspace` | dezenas de projects/configs/environments e centenas de flags |

Casos:

| Area | Caso |
|---|---|
| Listagens | Muitos itens continuam aparecendo e atualizando corretamente |
| Filtros/contexto | Selecionar org/project/config/environment correto |
| Updates | Edicoes em massa nao afetam tenant errado |
| Audit | Logs continuam filtraveis com volume maior |
| Config JSON | Apenas recursos ativos aparecem |
| Performance basica | Fluxos principais continuam usaveis em dataset maior |

## Matriz De Rotas Atuais

### Health

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/health` | Fase 1 |

### Auth

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/auth/github/start` | Unit/integration; E2E real opcional |
| GET | `/api/v1/auth/github/callback` | Unit/integration; E2E real opcional |
| GET | `/api/v1/auth/me` | Fase 1 |
| POST | `/api/v1/auth/logout` | Fase 1 |

### Organizations

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/organizations` | Fase 3 |
| POST | `/api/v1/organizations` | Fase 2/3 |
| GET | `/api/v1/organizations/:organizationId` | Fase 3 |
| GET | `/api/v1/organizations/:organizationId/members` | Fase 3/6 |
| POST | `/api/v1/organizations/:organizationId/members` | Fase 3/6 |
| PATCH | `/api/v1/organizations/:organizationId/members/:memberId` | Fase 3/6 |
| DELETE | `/api/v1/organizations/:organizationId/members/:memberId` | Fase 3/6 |

### Projects

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/projects` | Fase 3 |
| POST | `/api/v1/organizations/:organizationId/projects` | Fase 2/3 |
| GET | `/api/v1/projects/:projectId` | Fase 3 |
| PATCH | `/api/v1/projects/:projectId` | Fase 3 |
| DELETE | `/api/v1/projects/:projectId` | Fase 3 |
| GET | `/api/v1/projects/:projectId/members` | Fase 3/6 |
| POST | `/api/v1/projects/:projectId/members` | Fase 3/6 |
| PATCH | `/api/v1/projects/:projectId/members/:memberId` | Fase 3/6 |
| DELETE | `/api/v1/projects/:projectId/members/:memberId` | Fase 3/6 |

### Environments

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/projects/:projectId/environments` | Fase 3/6 |
| POST | `/api/v1/projects/:projectId/environments` | Fase 2/3 |
| PATCH | `/api/v1/environments/:environmentId` | Fase 3 |
| DELETE | `/api/v1/environments/:environmentId` | Fase 3 |

### Configs

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/projects/:projectId/configs` | Fase 3/6 |
| POST | `/api/v1/projects/:projectId/configs` | Fase 2/3 |
| DELETE | `/api/v1/configs/:configId` | Fase 3 |

### Feature Flags

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/configs/:configId/feature-flags` | Fase 3 |
| POST | `/api/v1/configs/:configId/feature-flags` | Fase 2/3 |
| PATCH | `/api/v1/configs/:configId/feature-flags/:featureFlagId` | Fase 3 |
| DELETE | `/api/v1/configs/:configId/feature-flags/:featureFlagId` | Fase 3 |
| GET | `/api/v1/configs/:configId/feature-flags/:featureFlagId/activity` | Fase 3 |
| PATCH | `/api/v1/configs/:configId/feature-flags/:featureFlagId/environments/:environmentId/value` | Fase 2/3/4 |

### Segments

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/configs/:configId/segments` | Fase 3/6 |
| POST | `/api/v1/configs/:configId/segments` | Fase 3/6 |
| PATCH | `/api/v1/configs/:configId/segments/:segmentId` | Fase 3/6 |
| DELETE | `/api/v1/configs/:configId/segments/:segmentId` | Fase 3/6 |

### SDK Keys

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/projects/:projectId/sdk-keys` | Fase 3 |
| POST | `/api/v1/projects/:projectId/sdk-keys` | Fase 2/3 |
| POST | `/api/v1/sdk-keys/:sdkKeyId/revoke` | Fase 3/4 |
| POST | `/api/v1/sdk-keys/:sdkKeyId/rotate` | Fase 3/4 |

### Public SDK E Preview

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/public-api/v1/sdk/:sdkKey/config` | Fase 2/4 |
| GET | `/api/v1/configs/:configId/environments/:environmentId/config-preview` | Fase 2/4 |

### Audit Logs

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/audit-logs` | Fase 3/8 |

### API Tokens

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/api-tokens` | Fase 6 |
| POST | `/api/v1/organizations/:organizationId/api-tokens` | Fase 6 |
| POST | `/api/v1/api-tokens/:apiTokenId/revoke` | Fase 6 |

### Management API

| Metodo | Rota | Cobertura alvo |
|---|---|---|
| GET | `/api/v1/projects` | Fase 6 |
| POST | `/api/v1/projects` | Fase 6 |
| GET | `/api/v1/flags?configId=` | Fase 6 |
| POST | `/api/v1/flags` | Fase 6 |
| PATCH | `/api/v1/flags/:id` | Fase 6 |
| GET | `/api/v1/environments?projectId=` | Fase 6 |

## Matriz De Paginas Atuais

| Pagina | Rota client | Cobertura browser sugerida |
|---|---|---|
| Login | `/login` | Smoke apenas enquanto OAuth real nao for usado |
| Organizations | `/organizations`, `/organizations/:organizationId` | Fase 7 |
| Projects | `/organizations/:organizationId/projects`, `/organizations/:organizationId/projects/:projectId` | Fase 7 |
| Environments | `/organizations/:organizationId/projects/:projectId/environments` | Fase 7 |
| Configs | `/organizations/:organizationId/projects/:projectId/configs`, `/organizations/:organizationId/projects/:projectId/configs/:configId` | Fase 7 |
| Flags | `/organizations/:organizationId/projects/:projectId/configs/:configId/flags` | Fase 7 |
| Segments | `/organizations/:organizationId/projects/:projectId/configs/:configId/segments` | Fase 7 |
| SDK Keys | `/organizations/:organizationId/projects/:projectId/sdk-keys` | Fase 7 |
| Audit Logs | `/organizations/:organizationId/audit-logs` | Fase 7/8 |

## Dados E Factories

Helpers recomendados:

| Helper | Responsabilidade |
|---|---|
| `resetDatabase()` | Limpar tabelas em ordem segura |
| `createUser()` | Criar user com email unico |
| `createSession()` | Criar token raw + hash e retornar cookie |
| `createOrganization()` | Criar org + membership |
| `createProject()` | Criar project + membership opcional |
| `createEnvironment()` | Criar environment |
| `createConfig()` | Criar config e states necessarios |
| `createFeatureFlag()` | Criar flag e valores por ambiente |
| `createSegment()` | Criar segment ativo |
| `createSdkKey()` | Criar SDK key e retornar raw key quando necessario |
| `createApiToken()` | Criar API token e retornar raw token quando necessario |

Regra pratica:

- Use API para validar fluxos de criacao reais.
- Use DB factory para montar estados complexos rapidamente.
- Nunca compartilhar estado entre arquivos de teste sem reset explicito.

## Comandos Alvo

Scripts futuros sugeridos:

```json
{
  "scripts": {
    "e2e": "npm --workspace @capture-flag/e2e run test",
    "e2e:ui": "npm --workspace @capture-flag/e2e run test:ui",
    "e2e:headed": "npm --workspace @capture-flag/e2e run test:headed"
  }
}
```

Fluxo local esperado:

```bash
npm --workspace @capture-flag/e2e run install:browsers
npm run e2e:db:up
npm run e2e
```

O workspace E2E prepara o banco automaticamente antes de rodar os testes. Por padrao ele usa `postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public`; para sobrescrever, use `E2E_DATABASE_URL`. O runner nao usa a `.env` local de desenvolvimento.

## Criterios De Pronto

Uma fase de E2E so deve ser considerada pronta quando:

- Roda localmente com banco E2E limpo.
- Nao depende de dados manuais.
- Nao depende de GitHub OAuth real.
- Falha com mensagem clara quando API/client/banco nao sobem.
- Pode ser rodada em CI.
- Nao altera banco de desenvolvimento.
- Documenta qualquer limitacao conhecida.

## Riscos E Controles

| Risco | Controle |
|---|---|
| Suite lenta demais | Comecar com poucos casos criticos e fixtures diretas no banco |
| UI mudando quebrar tudo | Priorizar API E2E agora e poucos browser E2E |
| Testes flakey | Evitar sleeps, usar assertions/eventos/retries do Playwright |
| Estado vazando entre testes | Reset de banco e `workers: 1` inicialmente |
| Banco errado ser apagado | Validar `DATABASE_URL` contem `e2e` antes de resetar |
| Credenciais vazarem | Gerar tokens fake em teste e nunca commitar `.env` real |
| Testar implementacao demais | Validar comportamento observavel e contratos publicos |

## Primeira Implementacao Recomendada

Escopo pequeno para a primeira PR:

1. Criar `apps/e2e`.
2. Adicionar Playwright.
3. Adicionar Postgres E2E no Docker Compose ou arquivo compose separado.
4. Criar helpers `db`, `reset` e `auth`.
5. Criar smoke tests para `/health`, `/auth/me` e client carregando.
6. Criar o inicio do golden path ate criar uma feature flag via API.

Nao implementar todas as fases de uma vez.
