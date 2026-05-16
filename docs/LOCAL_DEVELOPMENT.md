# Desenvolvimento Local - Capture Flag

## Pre-requisitos

| Ferramenta | Uso |
|---|---|
| Node.js | Rodar workspaces TypeScript |
| npm | Instalar dependencias e executar scripts |
| Docker Compose | Subir PostgreSQL local |
| GitHub OAuth App | Login do client |

## Setup

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
```

Configure no `.env`:

| Variavel | Valor local esperado |
|---|---|
| `DATABASE_URL` | `postgresql://capture_flag:capture_flag@localhost:5432/capture_flag?schema=public` |
| `POSTGRES_PORT` | `5432`, ou outra porta local se `5432` ja estiver ocupada |
| `API_BASE_URL` | `http://localhost:3000` |
| `CLIENT_BASE_URL` | `http://localhost:5173` |
| `CORS_ORIGINS` | Lista separada por virgula de origens permitidas; localmente `http://localhost:5173` |
| `CORS_ORIGIN` | Alternativa legada para uma unica origem permitida |
| `REQUIRE_HTTPS` | `false` localmente, ou `true` para simular HTTPS obrigatorio fora de producao; em producao HTTPS e sempre exigido |
| `API_TRUST_PROXY` | `false` localmente; use `true`, numero de hops ou valor do Express quando estiver atras de proxy |
| `PUBLIC_SDK_THROTTLE_LIMIT` | Limite por SDK key + IP na janela de throttle, padrao `600` |
| `PUBLIC_SDK_IP_THROTTLE_LIMIT` | Limite global por IP no endpoint publico para reduzir key-spray, padrao `6000` |
| `PUBLIC_SDK_THROTTLE_TTL_MS` | Janela de throttle do endpoint publico, padrao `60000` |
| `MANAGEMENT_API_THROTTLE_LIMIT` | Limite por IP antes da autenticacao Bearer e por API token + IP apos autenticacao, padrao `300` |
| `MANAGEMENT_API_THROTTLE_TTL_MS` | Janela de throttle da Public Management API, padrao `60000` |
| `GITHUB_CLIENT_ID` | Client ID do GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | Client secret do GitHub OAuth App |

Os rate limits da API usam janela fixa em memoria local do processo. Isso e suficiente
para o MVP/local, mas cada instancia mantem contadores independentes; ambientes
multi-instancia devem evoluir para um store distribuido, como Redis, antes de tratar
o limite como protecao global.

Callback do GitHub OAuth App:

```txt
http://localhost:3000/api/v1/auth/github/callback
```

## Comandos

| Comando | Descricao |
|---|---|
| `npm run dev:api` | Roda a API NestJS em modo watch |
| `npm run dev:client` | Roda o client Vite |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:migrate` | Aplica migrations no banco local |
| `npm run e2e:db:up` | Sobe o PostgreSQL dedicado para E2E |
| `npm run e2e` | Executa a suite E2E da Fase 1 |
| `npm run e2e:db:down` | Para o PostgreSQL dedicado para E2E |
| `npm run build` | Compila todos os workspaces |
| `npm run test` | Executa testes existentes |
| `npm run ai:sync` | Regenera rotas AIOS a partir de `ai/` |
| `npm run ai:check` | Verifica registry, referencias, exemplos e rotas geradas |
| `npm run lint` | Executa `ai:check` e Biome |

## E2E Local

A suite E2E vive em `apps/e2e` e usa Playwright com um PostgreSQL separado do banco de desenvolvimento.

Primeiro uso:

```bash
npm --workspace @capture-flag/e2e run install:browsers
npm run e2e:db:up
npm run e2e
```

Banco padrao do E2E:

```txt
postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public
```

Use `E2E_DATABASE_URL` para sobrescrever a URL. Os helpers de reset recusam URLs que nao contenham `e2e` para evitar apagar o banco local por acidente.

## Fluxo Manual Atual

1. Acesse `http://localhost:5173`.
2. Entre com GitHub.
3. Crie uma organizacao.
4. Adicione membros na organizacao, se houver outros usuarios ja autenticados.
5. Crie um projeto.
6. Conceda roles por projeto para membros da organizacao.
7. Confirme que o projeto recebe a config `default` automaticamente.
8. Crie um environment, por exemplo `production`.
9. Selecione a config e o environment.
10. Gere uma SDK key para a combinacao `config + environment`.
11. Copie a chave completa no momento da criacao.
12. Crie feature flags ou remote configs JSON na config selecionada.
13. Edite valores por ambiente, rules JSON, rollout percentual e valores `json_object`/`json_array`.
14. Crie segments na config e referencie-os nas rules com `{ "segment": "segment-key" }`.
15. Use a SDK key para buscar o Config JSON publico em `/public-api/v1/sdk/:sdkKey/config`.
16. Abra o painel de Audit Logs para filtrar eventos por actor, entidade, periodo e escopo.
17. Para automacao externa, crie API tokens em `/api/v1/organizations/:organizationId/api-tokens` e use `Authorization: Bearer <token>` nas rotas `/api/v1`.

## AIOS

O AIOS vive em `ai/` e e a fonte canonica de regras, arquitetura, glossario, exemplos e skills. As rotas em `.opencode/skills`, `.cursor/rules` e `.github/instructions` sao geradas por `npm run ai:sync`.

Fluxo para alterar conhecimento de IA:

1. Edite arquivos canonicos em `ai/rules`, `ai/architecture`, `ai/glossary`, `ai/examples` ou `ai/skills`.
2. Atualize `ai/registry.json` quando adicionar ou mudar uma skill roteada.
3. Rode `npm run ai:sync`.
4. Rode `npm run ai:check`.

## Estrutura Do Client

- `apps/client/src/components` contem componentes visuais compartilhados e pode usar barrel `components/index.ts`.
- `apps/client/src/core` contem apenas funcoes e hooks puros, reutilizaveis e independentes de contexto.
- Helpers de `core` ficam em `src/core/<categoria>/<nome>.ts`; exemplos atuais incluem `date`, `json`, `strings`, `validation` e `hooks`.
- Nao use barrels `index.ts` dentro de `src/core`; importe cada helper pelo arquivo direto, como `../../core/date/toDate`.
- Testes de `core` ficam em `src/core/<categoria>/__tests__/<nome>.test.ts`.
- Helpers especificos de pagina, dominio, API ou rota continuam colocalizados com a feature dona ate virarem reutilizaveis de forma independente.

## Rotas Do Client

| Rota | Tela |
|---|---|
| `/login` | Login GitHub |
| `/organizations` e `/organizations/:organizationId` | Organizacoes e membros |
| `/organizations/:organizationId/projects` e `/organizations/:organizationId/projects/:projectId` | Projetos e membros do projeto |
| `/organizations/:organizationId/projects/:projectId/environments` | Environments |
| `/organizations/:organizationId/projects/:projectId/configs` e `/configs/:configId` dentro do projeto | Configs e preview JSON |
| `/organizations/:organizationId/projects/:projectId/configs/:configId/flags` | Feature flags e remote config |
| `/organizations/:organizationId/projects/:projectId/configs/:configId/segments` | Segments |
| `/organizations/:organizationId/projects/:projectId/sdk-keys` | SDK keys |
| `/organizations/:organizationId/audit-logs` | Audit logs |

## Limites Atuais

Advanced targeting esta implementado com prerequisites, array contains, date comparisons e SemVer. Remote Config JSON esta implementado para `json_object` e `json_array`, mas prerequisites continuam restritos a flags primitivas. Public Management API esta disponivel em `/api/v1` com API tokens e OpenAPI em `/api/v1/docs`. Security esta implementado com Helmet, CORS configuravel, HTTPS obrigatorio em producao e rate limits por token/chave/IP; os rate limits atuais usam memoria local do processo e devem ser substituidos por um mecanismo distribuido antes de escalar multiplas instancias. Webhooks, CLI, Enterprise, OpenFeature e Mobile SDKs ficaram fora do MVP.
