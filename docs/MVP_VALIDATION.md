# Validacao Do MVP - Capture Flag

Este documento organiza a validacao do MVP por fases, para que o time possa atacar uma area por vez e registrar evidencias. O escopo validado aqui cobre o roadmap ate a Fase 15 - Security.

## Como Usar

1. Execute as fases em ordem, salvo quando uma validacao for claramente independente.
2. Marque cada item como concluido apenas quando houver evidencia objetiva.
3. Registre bugs, gaps e decisoes no bloco de resultado da fase.
4. Nao inclua fases removidas do MVP como bloqueadoras deste checklist.

Status sugeridos:

| Status | Significado |
|---|---|
| Pendente | Ainda nao iniciado |
| Em andamento | Validacao iniciada |
| Aprovado | Todos os criterios da fase passaram |
| Aprovado com ressalvas | Ha gaps conhecidos que nao bloqueiam o MVP |
| Reprovado | Ha blocker para o MVP |

## Escopo

Dentro do MVP:

| Area |
|---|
| Multi-tenant SaaS com organizacoes, projetos, configs e environments |
| GitHub OAuth e sessao em cookie HTTP-only |
| Project members e RBAC |
| SDK keys por config + environment |
| Feature flags e remote config |
| Config JSON publico versionado e cacheavel |
| Evaluator local, SDK JS e React SDK |
| Polling, cache, ETag e 304 |
| Segments e advanced targeting |
| Audit logs avancados |
| Public Management API |
| Hardening de seguranca da Fase 15 |

Fora do MVP:

| Fase | Motivo |
|---|---|
| Fase 12 - Integrations e Webhooks | Removida do MVP |
| Fase 14 - CLI | Removida do MVP |
| Fase 16 - Enterprise | Removida do MVP |
| Fase 17 - Performance avancada | Removida do MVP |
| Fase 18 - OpenFeature | Removida do MVP |
| Fase 19 - Mobile SDKs | Removida do MVP |
| Fase 20 - Documentation completa | Removida do MVP |
| Fase 21 - Billing | Removida do MVP |

## Resumo Executivo

| Campo | Valor |
|---|---|
| Data da validacao | TBD |
| Responsavel | TBD |
| Branch/commit | TBD |
| Ambiente | Local |
| Status geral | Pendente |

## Fase 0 - Preparacao

Objetivo: garantir que o ambiente local e as dependencias estao prontos para validacao.

Checklist:

- [ ] `.env` criado a partir de `.env.example`.
- [ ] `GITHUB_CLIENT_ID` configurado.
- [ ] `GITHUB_CLIENT_SECRET` configurado.
- [ ] Docker Compose disponivel.
- [ ] PostgreSQL local iniciado.
- [ ] Dependencias instaladas com `npm install`.
- [ ] Prisma Client gerado, se necessario.
- [ ] Migrations aplicadas com `npm run db:migrate`.

Comandos sugeridos:

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
```

Criterios de aceite:

- [ ] API consegue conectar no banco.
- [ ] Client consegue chamar a API local.
- [ ] Login GitHub tem callback configurado para `http://localhost:3000/api/v1/auth/github/callback`.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 1 - Consistencia Documental

Objetivo: confirmar que os documentos prometem o mesmo MVP implementado.

Checklist:

- [ ] `README.md` informa que o estado atual cobre ate a Fase 15 - Security.
- [ ] `docs/EXECUTION_PLAN.md` lista a Fase 15 como estado implementado.
- [ ] `docs/ROADMAP.md` marca fases posteriores fora/removidas do MVP quando aplicavel.
- [ ] `docs/PRODUCT.md` continua alinhado aos principios de avaliacao local, multi-tenant seguro e SDK first.
- [ ] `docs/DATA_MODEL.md` descreve invariantes usadas pela API.
- [ ] `docs/CONFIG_FORMAT.md` descreve o mesmo Config JSON servido pela API e consumido pelos SDKs.

Criterios de aceite:

- [ ] Nenhuma entrega marcada como implementada esta ausente do produto.
- [ ] Nenhum recurso removido do MVP aparece como blocker.
- [ ] Contratos publicos estao coerentes entre docs, API, evaluator e SDKs.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 2 - Verificacao Automatizada

Objetivo: garantir que testes, build, lint e rotas AI passam antes da validacao manual.

Checklist:

- [ ] `npm run ai:check` passa.
- [ ] `npm run lint` passa.
- [ ] `npm run test` passa.
- [ ] `npm run build` passa.
- [ ] Testes da API passam isoladamente.
- [ ] Testes do client passam isoladamente.
- [ ] Testes do evaluator passam isoladamente.
- [ ] Testes do SDK JS passam isoladamente.
- [ ] Testes do React SDK passam isoladamente.

Comandos sugeridos:

```bash
npm run ai:check
npm run lint
npm run test
npm run build
npm --workspace @capture-flag/api run test
npm --workspace @capture-flag/client run test
npm --workspace @capture-flag/evaluator run test
npm --workspace @capture-flag/sdk-js run test
npm --workspace @capture-flag/react run test
```

Criterios de aceite:

- [ ] Todos os comandos obrigatorios passam sem erro.
- [ ] Falhas conhecidas, se houver, estao registradas e classificadas.
- [ ] Nenhuma falha automatizada bloqueadora permanece aberta.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 3 - Fluxo Manual Vertical

Objetivo: validar a fatia principal do MVP, do login ao consumo de uma flag via SDK.

Checklist:

- [ ] Subir API com `npm run dev:api`.
- [ ] Subir client com `npm run dev:client`.
- [ ] Acessar `http://localhost:5173`.
- [ ] Entrar com GitHub OAuth.
- [ ] Criar uma organizacao.
- [ ] Criar um projeto.
- [ ] Confirmar criacao automatica da config `default`.
- [ ] Criar environment `production`.
- [ ] Selecionar projeto, config e environment.
- [ ] Criar SDK key para `config + environment`.
- [ ] Copiar a SDK key completa no momento da criacao.
- [ ] Criar feature flag booleana.
- [ ] Editar valor por ambiente.
- [ ] Buscar Config JSON publico com a SDK key.
- [ ] Consumir a flag pelo SDK JS.
- [ ] Consumir a flag pelo React SDK, quando aplicavel.
- [ ] Confirmar audit logs gerados para as alteracoes principais.

Criterios de aceite:

- [ ] Usuario consegue ir de zero ate consumir uma flag localmente no SDK.
- [ ] Config JSON publico contem apenas dados da config/environment da SDK key.
- [ ] Fluxo nao exige chamadas manuais fora do produto, exceto validacoes tecnicas.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 4 - Feature Flags E Remote Config

Objetivo: validar tipos, valores por ambiente, publicacao no Config JSON e consumo pelos SDKs.

Checklist:

- [ ] Criar flag `boolean`.
- [ ] Criar config `string`.
- [ ] Criar config `integer`.
- [ ] Criar config `double`.
- [ ] Criar config `json_object`.
- [ ] Criar config `json_array`.
- [ ] Editar valor padrao por ambiente para cada tipo.
- [ ] Confirmar que valores mantem tipo no client.
- [ ] Confirmar que valores mantem tipo na API.
- [ ] Confirmar que valores mantem tipo no Config JSON publico.
- [ ] Confirmar que valores mantem tipo no SDK JS.
- [ ] Confirmar que JSON invalido e rejeitado pelo client/API.
- [ ] Arquivar uma flag e confirmar que ela some das listagens ativas.
- [ ] Confirmar que flag arquivada nao aparece no Config JSON publico.

Criterios de aceite:

- [ ] Todos os tipos suportados funcionam de ponta a ponta.
- [ ] Alteracoes publicas incrementam revision/ETag quando aplicavel.
- [ ] JSON invalido nao e salvo.
- [ ] Flags arquivadas nao sao entregues aos SDKs.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 5 - Targeting, Segments E Rollout

Objetivo: validar avaliacao local com regras, segmentos, prerequisites, operadores avancados e rollout percentual.

Checklist:

- [ ] Criar rule simples com `equals`.
- [ ] Criar rule com multiplas conditions em AND.
- [ ] Criar multiplas rules para validar OR top-down.
- [ ] Criar percentage rollout deterministico.
- [ ] Confirmar que o mesmo usuario cai sempre no mesmo bucket.
- [ ] Criar segment por config.
- [ ] Usar segment em rule com `{ "segment": "segment-key" }`.
- [ ] Confirmar que alteracao de segment atualiza revision/ETag.
- [ ] Criar prerequisite flag com `equals`.
- [ ] Criar prerequisite flag com `notEquals`.
- [ ] Confirmar que ciclo de prerequisites e rejeitado pela API.
- [ ] Validar `arrayContains`.
- [ ] Validar `dateBefore` e `dateAfter`.
- [ ] Validar operadores SemVer.
- [ ] Validar comportamento com atributo ausente.

Criterios de aceite:

- [ ] Evaluation Context nunca e enviado para a API durante avaliacao.
- [ ] SDK/evaluator retornam resultados previsiveis.
- [ ] Rules sao avaliadas top-down.
- [ ] Prerequisites nao permitem ciclos persistidos.
- [ ] Config malformada nao quebra o SDK de forma insegura.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 6 - Config JSON Publico E Cache HTTP

Objetivo: validar contrato publico de entrega de configuracao para SDKs.

Endpoint:

```http
GET /public-api/v1/sdk/:sdkKey/config
```

Checklist:

- [ ] SDK key valida retorna `200`.
- [ ] SDK key invalida retorna erro esperado.
- [ ] SDK key revogada retorna erro esperado.
- [ ] Resposta contem `schemaVersion` esperado.
- [ ] Resposta contem `revision` esperado.
- [ ] Resposta contem apenas flags/settings da config correta.
- [ ] Resposta contem apenas valores do environment correto.
- [ ] Resposta contem `ETag`.
- [ ] Resposta contem `Cache-Control`.
- [ ] `If-None-Match` com ETag atual retorna `304 Not Modified`.
- [ ] Alterar flag publica muda revision/ETag.
- [ ] Alterar segment publico muda revision/ETag.
- [ ] Dados privados de tenant nao aparecem no JSON publico.

Criterios de aceite:

- [ ] Endpoint e cacheavel e seguro.
- [ ] SDK key nao permite acesso cruzado entre tenants, configs ou environments.
- [ ] JSON publico segue `docs/CONFIG_FORMAT.md`.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 7 - SDK JS E React SDK

Objetivo: validar confiabilidade dos SDKs consumindo Config JSON publico e avaliando localmente.

Checklist SDK JS:

- [ ] Lazy loading funciona como modo padrao.
- [ ] `refresh()` atualiza config manualmente.
- [ ] Auto polling atualiza config em background.
- [ ] Offline mode usa cache local quando disponivel.
- [ ] Cache em memoria funciona.
- [ ] localStorage opt-in funciona no browser.
- [ ] SDK envia `If-None-Match` quando tem ETag.
- [ ] SDK trata `304 Not Modified` sem reprocessar config.
- [ ] SDK reaproveita cache valido quando refresh falha.
- [ ] Config invalida nao substitui cache valido.
- [ ] `client.close()` encerra polling.
- [ ] SDK nao armazena raw SDK key em cache persistente.

Checklist React SDK:

- [ ] Provider inicializa corretamente.
- [ ] `useFeatureFlag` retorna fallback no render inicial quando necessario.
- [ ] Hook avalia flag localmente.
- [ ] Hook re-renderiza apos mudanca de config via subscription/polling.
- [ ] Cleanup remove subscriptions no unmount.

Criterios de aceite:

- [ ] SDK JS funciona em Node/browser conforme escopo atual.
- [ ] React SDK reflete mudancas sem reload manual da aplicacao.
- [ ] Falhas de rede usam fallback/cache de forma segura.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 8 - Multi-Tenant E RBAC

Objetivo: validar isolamento de tenant e permissoes por organizacao/projeto.

Checklist:

- [ ] Criar pelo menos duas organizacoes.
- [ ] Criar pelo menos dois projetos em organizacoes diferentes.
- [ ] Confirmar que usuario nao acessa organizacao sem membership.
- [ ] Confirmar que usuario nao acessa projeto sem role valida.
- [ ] Validar permissoes de organization `owner`.
- [ ] Validar permissoes de organization `admin`.
- [ ] Validar permissoes de organization `member`.
- [ ] Validar permissoes de organization `viewer`.
- [ ] Validar permissoes de project `project_admin`.
- [ ] Validar permissoes de project `developer`.
- [ ] Validar permissoes de project `viewer`.
- [ ] Confirmar que viewer nao edita.
- [ ] Confirmar que developer nao gerencia membros.
- [ ] Confirmar que project admin nao gerencia projeto sem acesso.
- [ ] Confirmar que gates do client sao apenas UX e API continua bloqueando acessos indevidos.

Criterios de aceite:

- [ ] Toda rota privada valida tenant antes de retornar dados.
- [ ] Permissoes batem com a matriz da Fase 10 do roadmap.
- [ ] Nao ha vazamento entre organizacoes, projetos, configs, environments, flags ou SDK keys.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 9 - Audit Logs

Objetivo: validar rastreabilidade das alteracoes importantes do MVP.

Checklist:

- [ ] Flag criada gera audit log.
- [ ] Flag alterada gera audit log.
- [ ] Valor por ambiente alterado gera audit log.
- [ ] Rule adicionada/removida gera audit log.
- [ ] SDK key criada gera audit log.
- [ ] SDK key rotacionada/revogada gera audit log.
- [ ] Segmento criado/alterado/removido gera audit log.
- [ ] Membro de organizacao adicionado/alterado/removido gera audit log.
- [ ] Membro de projeto adicionado/alterado/removido gera audit log.
- [ ] Config publicada ou alteracao equivalente gera audit log quando aplicavel.
- [ ] Logs exibem actor.
- [ ] Logs exibem entidade.
- [ ] Logs exibem timestamp.
- [ ] Logs exibem old/new/metadata quando aplicavel.
- [ ] Client filtra por actor.
- [ ] Client filtra por entidade.
- [ ] Client filtra por periodo.
- [ ] Client filtra por escopo de projeto/config.

Criterios de aceite:

- [ ] Logs sao imutaveis do ponto de vista do produto.
- [ ] Nenhum audit log exige campo manual obrigatorio do usuario para ser gerado.
- [ ] Timeline e painel filtravel permitem investigacao operacional basica.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 10 - Public Management API

Objetivo: validar automacao externa via API versionada.

Checklist:

- [ ] OpenAPI esta disponivel em `/api/v1/docs`.
- [ ] Criar API token pela UI/API.
- [ ] Token cru aparece apenas na criacao.
- [ ] Token e persistido apenas como hash.
- [ ] Bearer token valido autentica em `/api/v1`.
- [ ] Token sem scope recebe erro esperado.
- [ ] Token revogado nao autentica.
- [ ] Rate limit por IP funciona antes da autenticacao.
- [ ] Rate limit por token + IP funciona apos autenticacao.
- [ ] `GET /api/v1/projects` funciona com token autorizado.
- [ ] `POST /api/v1/projects` funciona com token autorizado.
- [ ] `GET /api/v1/projects/:id/configs` funciona com token autorizado.
- [ ] `POST /api/v1/projects/:id/configs` funciona com token autorizado.
- [ ] `GET /api/v1/flags?configId=:id` funciona com token autorizado.
- [ ] `POST /api/v1/flags` funciona com token autorizado.
- [ ] `PATCH /api/v1/flags/:id` funciona com token autorizado.
- [ ] `GET /api/v1/environments?projectId=:id` funciona com token autorizado.
- [ ] Endpoints de membros de organizacao/projeto funcionam com token autorizado.
- [ ] Endpoints de segments funcionam com token autorizado.

Criterios de aceite:

- [ ] API publica cobre o subconjunto documentado de automacao do MVP.
- [ ] Scopes limitam acoes corretamente.
- [ ] Tokens nao vazam em texto puro apos criacao.
- [ ] OpenAPI reflete rotas versionadas publicas de management.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 11 - Security

Objetivo: validar hardening documentado na Fase 15.

Checklist:

- [ ] Helmet/security headers estao presentes.
- [ ] CORS permite apenas origens configuradas.
- [ ] `CORS_ORIGINS` funciona com lista separada por virgula.
- [ ] `CORS_ORIGIN` legado ainda funciona se aplicavel.
- [ ] Local funciona com `REQUIRE_HTTPS=false`.
- [ ] Producao exige HTTPS quando configurado.
- [ ] `API_TRUST_PROXY` funciona para deploy atras de proxy.
- [ ] Endpoint publico aplica rate limit por SDK key + IP.
- [ ] Endpoint publico aplica rate limit global por IP.
- [ ] Public Management API aplica rate limit por IP/token.
- [ ] Limite de rate limit em memoria/processo local esta documentado como risco residual para multi-instancia.
- [ ] Sessao usa cookie HTTP-only.
- [ ] Session token e salvo como hash.
- [ ] SDK key e salva como hash.
- [ ] API token e salvo como hash.
- [ ] SDK key revogada nao acessa Config JSON.
- [ ] API token revogado nao acessa Management API.
- [ ] Queries privadas nao vazam dados entre tenants.

Criterios de aceite:

- [ ] Ambiente local segue seguro sem bloquear desenvolvimento.
- [ ] Ambiente de producao bloqueia HTTP quando exigido.
- [ ] Tokens/chaves crus nao sao persistidos.
- [ ] Rate limits reduzem abuso por chave, token e IP.

Resultado:

| Campo | Valor |
|---|---|
| Status | Pendente |
| Evidencias | TBD |
| Bugs/Gaps | TBD |

## Fase 12 - Relatorio Final

Objetivo: consolidar resultado e decidir se o MVP esta aprovado.

Checklist:

- [ ] Resumir comandos executados.
- [ ] Anexar resultados de testes/build/lint.
- [ ] Resumir fluxos manuais validados.
- [ ] Listar bugs bloqueadores.
- [ ] Listar bugs nao bloqueadores.
- [ ] Listar gaps de documentacao.
- [ ] Listar riscos residuais.
- [ ] Confirmar itens fora do MVP.
- [ ] Definir status final.

Modelo de resultado:

| Campo | Valor |
|---|---|
| Status final | Pendente |
| Comandos executados | TBD |
| Fluxos aprovados | TBD |
| Blockers | TBD |
| Ressalvas | TBD |
| Riscos residuais | TBD |
| Decisao | TBD |

## Definition Of Done Do MVP

O MVP pode ser considerado validado quando:

- [ ] `npm run test` passa.
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] Fluxo manual cria e consome uma flag via SDK.
- [ ] Config JSON publico respeita ETag/cache/tenant.
- [ ] SDK JS e React SDK funcionam com avaliacao local.
- [ ] RBAC e tenant isolation bloqueiam acessos indevidos.
- [ ] Tokens, sessoes e SDK keys nao sao persistidos crus.
- [ ] Audit logs cobrem alteracoes importantes.
- [ ] Documentacao nao promete recurso fora do MVP.
