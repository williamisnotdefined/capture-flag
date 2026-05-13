# Produto - Capture Flag

## Objetivo

Construir uma plataforma de feature flags e remote config inspirada em servicos como ConfigCat, mas com dominio, SDK, Configs e formato de configuracao proprios.

O produto deve permitir que times criem organizacoes, projetos, configs, ambientes, feature flags, regras de targeting, rollouts percentuais e SDKs capazes de consumir configuracoes localmente com cache.

## Principios Do Produto

| Principio | Descricao |
|---|---|
| Avaliacao local | SDK avalia flags localmente; dados do usuario nao sao enviados para a API |
| Config versionado | O JSON publico deve ter versao de schema desde o inicio |
| Multi-tenant seguro | Todas as entidades importantes devem ser isoladas por organizacao/projeto |
| Infra local simples | O projeto deve rodar localmente com Docker Compose para desenvolvimento e testes |
| SDK first | O client cria configuracoes; o SDK precisa ser confiavel para uso em producao |
| Menor MVP util | Priorizar uma fatia vertical funcionando antes de recursos enterprise |

## Termos Do Dominio

| Termo | Descricao |
|---|---|
| User | Usuario autenticado da plataforma |
| OAuth Account | Conta externa vinculada a um usuario, como GitHub ou Google |
| Session | Sessao opaca usada pelo client via cookie HTTP-only |
| Organization | Conta, empresa ou time dono dos projetos |
| Organization Member | Usuario com acesso a uma organizacao |
| Project | Produto/aplicacao que agrupa configs, ambientes e membros |
| Project Member | Usuario com role especifica em um projeto |
| Config | Conjunto de flags/settings consumido como Config JSON pelo SDK |
| Environment | Ambiente como development, staging e production |
| Feature Flag | Setting booleano para ligar/desligar comportamento |
| Remote Config | Setting nao booleano: string, integer, double ou JSON |
| SDK Key | Chave publica somente leitura usada por SDKs, escopada por config e ambiente |
| Config JSON | Arquivo publico versionado baixado pelos SDKs |
| Role | Conjunto de permissoes aplicado em organizacao ou projeto |
| Evaluation Context | Dados passados ao SDK para avaliar regras localmente |
| Targeting Rule | Regra para servir valor diferente por usuario/contexto |
| Percentage Rollout | Distribuicao percentual deterministica de valores |
| Segment | Grupo reutilizavel de condicoes de usuario, futuro Fase 6 |
| Audit Log | Registro imutavel minimo de alteracoes |
| Config Version | Snapshot publicado de uma config em um ambiente, futuro Fase 11 |

## Modelo SaaS Multi-Tenant

Decisao: SaaS multi-tenant desde o inicio. A infraestrutura local existe para desenvolvimento, testes e operacao simples, sem comprometer o desenho SaaS.

Trinca principal do dominio: organizacoes possuem usuarios e projetos; projetos possuem configs e ambientes; usuarios recebem roles na organizacao e, quando necessario, roles especificas por projeto.

| Requisito | Implicacao |
|---|---|
| Tenant isolation | Banco sempre escopado por organizacao/projeto |
| Organization membership | Uma organizacao pode ter N usuarios; usuarios sao globais e acessam organizacoes via membership |
| Project membership | Usuarios podem ter roles diferentes em projetos diferentes da mesma organizacao |
| Rotas privadas | Toda rota valida tenant e permissao antes de acessar recurso |
| Permission scopes | Permissoes sao concedidas em organizacao ou projeto |
| SDK keys | Chaves sao somente leitura e escopadas por config/ambiente |
| SaaS futuro | Billing, quotas e planos entram depois, sem remodelar o dominio |
