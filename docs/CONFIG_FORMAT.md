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
  "flags": {
    "newCheckout": {
      "type": "boolean",
      "defaultValue": false,
      "rules": [],
      "percentageAttribute": "identifier",
      "percentageOptions": []
    }
  }
}
```

O `ETag` deve ser exposto como header HTTP e derivado da revisao ou do conteudo. O endpoint publico deve aceitar `If-None-Match` e responder `304 Not Modified` quando a config nao mudou.

Esse caminho reduz complexidade e permite evoluir o SDK sem depender de outro produto.
