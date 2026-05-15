# Config Format - Capture Flag

## Formato De Config

Decisao: usar SDK proprio e Config JSON proprio versionado desde o inicio. Compatibilidade com SDKs oficiais do ConfigCat esta fora do escopo inicial.

O MVP usa publicacao automatica: alterar uma flag no client atualiza a revisao da config daquele par `config + environment`.

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
    "accountEnabled": {
      "type": "boolean",
      "defaultValue": true,
      "rules": [],
      "percentageAttribute": "identifier",
      "percentageOptions": []
    },
    "newCheckout": {
      "type": "boolean",
      "defaultValue": false,
      "rules": [
        {
          "conditions": [
            { "segment": "beta-users" },
            { "prerequisiteFlag": "accountEnabled", "operator": "equals", "value": true },
            { "attribute": "custom.tags", "operator": "arrayContains", "value": "beta" },
            { "attribute": "custom.releaseDate", "operator": "dateAfter", "value": "2026-05-12" },
            { "attribute": "custom.appVersion", "operator": "semverGreaterThan", "value": "1.2.3" }
          ],
          "serve": true
        }
      ],
      "percentageAttribute": "identifier",
      "percentageOptions": []
    },
    "themeConfig": {
      "type": "json_object",
      "defaultValue": {
        "theme": "dark",
        "enabledModules": ["checkout", "billing"]
      },
      "rules": [],
      "percentageAttribute": "identifier",
      "percentageOptions": []
    }
  }
}
```

Tipos suportados em `flags[*].type`: `boolean`, `string`, `integer`, `double`, `json_object` e `json_array`. `json_object` exige objeto JSON como raiz; `json_array` exige array JSON como raiz. Valores JSON sao preservados em `defaultValue`, `rules[*].serve` e `percentageOptions[*].value`, sem serializar como string.

O `ETag` deve ser exposto como header HTTP e derivado da revisao ou do conteudo. O endpoint publico deve aceitar `If-None-Match` e responder `304 Not Modified` quando a config nao mudou.

Rollout percentual deve ser deterministico entre SDKs. O bucket e calculado com FNV-1a 32-bit unsigned sobre a string `${flagKey}:${attributeValue}` codificada como unidades UTF-16/JavaScript, usando offset basis `2166136261` e prime `16777619`. O resultado unsigned (`hash >>> 0`) deve ser reduzido por modulo `10000`, gerando bucket inteiro `0..9999`. Percentuais usam basis points: `1% = 100` unidades, `0.01% = 1` unidade, e precision acima de duas casas decimais e invalida. Quando `percentageOptions` nao esta vazio, a soma deve ser exatamente `100%`. A primeira opcao cujo limite cumulativo seja maior que o bucket vence.

`segments` e opcional para caches antigos, mas configs geradas pela API atual devem envia-lo como objeto. Cada segmento contem `conditions`, usando os mesmos operadores de targeting baseados em atributos. Rules referenciam segmentos com uma condition `{ "segment": "segment-key" }`. Segmentos nao podem referenciar outros segmentos na Fase 6.

Advanced targeting da Fase 7 expande conditions sem mudar `schemaVersion`:

| Condition | Forma | Observacao |
|---|---|---|
| Segment reference | `{ "segment": "beta-users" }` | Apenas em rules; segmentos nao podem aninhar segmentos |
| Prerequisite flag | `{ "prerequisiteFlag": "accountEnabled", "operator": "equals", "value": true }` | Apenas `equals` e `notEquals`; valor deve bater com o tipo primitivo da flag referenciada; flags JSON nao sao prerequisites validas |
| Array contains | `{ "attribute": "custom.tags", "operator": "arrayContains", "value": "beta" }` | O atributo do Evaluation Context deve ser array |
| Date comparison | `{ "attribute": "custom.releaseDate", "operator": "dateAfter", "value": "2026-05-12" }` | `dateBefore` e `dateAfter`; aceita timestamp numerico ou string ISO `YYYY-MM-DD`/date-time com timezone |
| SemVer comparison | `{ "attribute": "custom.appVersion", "operator": "semverGreaterThan", "value": "1.2.3" }` | Operadores: `semverEquals`, `semverGreaterThan`, `semverGreaterThanOrEquals`, `semverLessThan`, `semverLessThanOrEquals`; exige string SemVer 2.0.0 `MAJOR.MINOR.PATCH`; build metadata e ignorado; prerelease segue precedencia SemVer |

Prerequisite flags sao avaliadas localmente pelo SDK usando a mesma Config JSON. Ciclos sao rejeitados pela API e tratados como non-match pelo evaluator para proteger SDKs contra configs invalidas. `json_object` e `json_array` podem ser valores servidos, mas nao entram na semantica de comparacao de prerequisites.

Esse caminho reduz complexidade e permite evoluir o SDK sem depender de outro produto.
