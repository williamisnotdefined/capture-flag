# Config Format - Capture Flag

## Formato De Config

Decisao: usar SDK proprio e Config JSON proprio versionado desde o inicio. Compatibilidade com SDKs oficiais do ConfigCat esta fora do escopo inicial.

O MVP usa publicacao automatica: alterar uma flag no client atualiza a revisao da config daquele par `config + environment`. Snapshot, diff e rollback entram depois em Config Versions.

Exemplo inicial:

```json
{
  "schemaVersion": 1,
  "projectKey": "my-project",
  "configKey": "frontend-web",
  "environment": "production",
  "revision": 42,
  "generatedAt": "2026-05-12T00:00:00.000Z",
  "segments": {
    "beta-users": {
      "conditions": [
        {
          "attribute": "email",
          "operator": "endsWith",
          "value": "@example.com"
        }
      ]
    }
  },
  "flags": {
    "newCheckout": {
      "type": "boolean",
      "defaultValue": false,
      "rules": [
        {
          "conditions": [{ "segment": "beta-users" }],
          "serve": true
        }
      ],
      "percentageAttribute": "identifier",
      "percentageOptions": []
    }
  }
}
```

O `ETag` deve ser exposto como header HTTP e derivado da revisao ou do conteudo. O endpoint publico deve aceitar `If-None-Match` e responder `304 Not Modified` quando a config nao mudou.

`segments` e opcional para caches antigos, mas configs geradas pela API atual devem envia-lo como objeto. Cada segmento contem `conditions`, usando os mesmos operadores de targeting baseados em atributos. Rules referenciam segmentos com uma condition `{ "segment": "segment-key" }`. Segmentos nao podem referenciar outros segmentos na Fase 6.

Esse caminho reduz complexidade e permite evoluir o SDK sem depender de outro produto.
