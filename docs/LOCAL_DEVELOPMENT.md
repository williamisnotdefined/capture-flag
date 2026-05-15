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
| `PUBLIC_SDK_THROTTLE_LIMIT` | Limite por SDK key + IP na janela de throttle, padrao `600` |
| `PUBLIC_SDK_THROTTLE_TTL_MS` | Janela de throttle do endpoint publico, padrao `60000` |
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
12. Crie feature flags na config selecionada.
13. Edite valores por ambiente, rules JSON e rollout percentual.
14. Crie segments na config e referencie-os nas rules com `{ "segment": "segment-key" }`.
15. Use a SDK key para buscar o Config JSON publico em `/public/sdk/:sdkKey/config`.

## Limites Atuais

Advanced targeting esta implementado com prerequisites, array contains, date comparisons e SemVer. Config versions, webhooks, API publica de gerenciamento e RBAC avancado entram em fases futuras do roadmap.
