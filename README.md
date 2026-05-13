# capture-flag

Capture Flag e uma plataforma SaaS multi-tenant de feature flags e remote config, inspirada em produtos como ConfigCat, mas com SDK proprio e Config JSON proprio.

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
