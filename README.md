# capture-flag

Capture Flag e uma plataforma SaaS multi-tenant de feature flags e remote config, inspirada em produtos como ConfigCat, mas com SDK proprio e Config JSON proprio.

## Estado Atual

A implementacao cobre ate a Fase 9 - Audit Logs Avancados do roadmap:

| Area | Estado |
|---|---|
| Monorepo | npm workspaces com `apps/api`, `apps/client`, `packages/shared`, `packages/evaluator`, `packages/sdk-js` e `packages/react` |
| API | NestJS com healthcheck, auth GitHub, sessoes, organizations, projects, configs, environments, SDK keys, feature flags, segments, advanced targeting e audit logs avancados |
| Banco | Prisma + PostgreSQL com migrations da fundacao, feature flags, segments e audit logs |
| Infra local | Docker Compose para PostgreSQL |
| Client | Vite + React com fluxo operacional para login, organizacoes, projetos, membros, configs, environments, SDK keys, feature flags, filtros, JSON preview, timeline e segments |
| Evaluator | Motor local em `@capture-flag/evaluator` com rules, segmentos, prerequisites, comparadores avancados e rollout percentual deterministico |
| SDK JS | `@capture-flag/sdk-js` busca Config JSON publico, usa cache em memoria/localStorage opcional, ETag, refresh manual, polling e avaliacao local |
| React SDK | `@capture-flag/react` expõe Provider e hook `useFeatureFlag` com live updates via subscriptions do SDK JS |

Client melhorado esta implementado com busca/filtros de flags, switchers rapidos, preview do Config JSON, gestao de SDK keys, timeline por flag e painel filtravel de audit logs.

## Desenvolvimento Local

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run dev:api
npm run dev:client
```

Configure `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no `.env` antes de usar login GitHub. O callback esperado e `http://localhost:3000/auth/github/callback`.

URLs locais:

| Servico | URL |
|---|---|
| API | `http://localhost:3000` |
| Client | `http://localhost:5173` |
| Healthcheck | `http://localhost:3000/health` |

## Modelo Do Produto

Hierarquia principal:

```txt
Organization
  Project
    Config
      Feature Flags / Settings
    Environment
```

Conceitos centrais:

| Conceito | Descricao |
|---|---|
| Organization | Tenant principal, empresa ou time |
| Project | Produto, aplicacao ou sistema |
| Config | Conjunto obrigatorio de flags/settings consumido pelo SDK |
| Environment | Ambiente como development, staging ou production |
| SDK Key | Chave publica somente leitura para uma combinacao `config + environment` |
| Config JSON | Artefato versionado e cacheavel baixado pelos SDKs |

## Regra De Config

Toda flag pertence a uma Config. Toda SDK key aponta para uma Config e um Environment.

Para manter o MVP simples, ao criar um Project o sistema deve criar automaticamente uma Config inicial com key `default`. A UI pode esconder o seletor de Config enquanto existir apenas uma Config no Project.

## Documentacao

| Documento | Conteudo |
|---|---|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Objetivo, principios, termos do dominio e modelo SaaS multi-tenant |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Fases de evolucao do produto |
| [`docs/EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md) | Ordem inicial para implementar o MVP |
| [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) | Stack, decisoes fechadas e decisoes futuras |
| [`docs/CONFIG_FORMAT.md`](docs/CONFIG_FORMAT.md) | Config JSON publico e cache HTTP |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Modelo relacional, constraints e invariantes |
| [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) | Setup local, comandos e fluxo manual da Fase 1 |
