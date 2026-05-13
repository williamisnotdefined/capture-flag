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
| `CORS_ORIGIN` | `http://localhost:5173` |
| `GITHUB_CLIENT_ID` | Client ID do GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | Client secret do GitHub OAuth App |

Callback do GitHub OAuth App:

```txt
http://localhost:3000/auth/github/callback
```

## Comandos

| Comando | Descricao |
|---|---|
| `npm run dev:api` | Roda a API NestJS em modo watch |
| `npm run dev:client` | Roda o client Vite |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:migrate` | Aplica migrations no banco local |
| `npm run build` | Compila todos os workspaces |
| `npm run test` | Executa testes existentes |
| `npm run lint` | Executa Biome |

## Fluxo Manual Da Fase 1

1. Acesse `http://localhost:5173`.
2. Entre com GitHub.
3. Crie uma organizacao.
4. Crie um projeto.
5. Confirme que o projeto recebe a config `default` automaticamente.
6. Crie um environment, por exemplo `production`.
7. Gere uma SDK key para a combinacao `config + environment`.
8. Copie a chave completa no momento da criacao.

## Limites Da Fase 1

Ainda nao existem CRUD de feature flags, endpoint publico de Config JSON, cache HTTP, evaluator real ou SDK funcional. Os pacotes `@capture-flag/evaluator` e `@capture-flag/sdk-js` existem apenas como base compilavel para fases futuras.
