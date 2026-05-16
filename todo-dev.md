* i18n | estudar lib | jsons locais sempre | pt-BR en-US espanhol
* AIOS


=====
Quero continuar uma rodada de melhoria/refactor técnico no repositório Capture Flag.
Objetivo: examinar os módulos novos e existentes com rigor de engenharia sênior, encontrar acoplamentos, services grandes demais, vazamentos de responsabilidade, gaps de teste, riscos de tenant/security/audit/config-state, e propor/implementar melhorias pequenas, seguras e verificáveis.
Primeiro faça uma fase read-only:
1. Inspecione `git status --short` e não reverta nem altere mudanças existentes.
2. Mapeie módulos em `apps/api/src`, controllers, DTOs, modules, facades/services, `use-cases`, `support`, guards e testes próximos.
3. Identifique módulos recém-criados ou com arquitetura divergente.
4. Compare os padrões bons já usados no repo: controllers finos, Nest modules nativos, use cases pequenos, support services para access/audit/input/read-model/credentials, DTOs locais e testes Vitest focados em comportamento.
5. Procure riscos específicos:
   - tenant isolation por organization/project/config/environment;
   - reads/writes por global ID sem resolver ownership;
   - raw credentials/tokens/SDK keys sendo persistidos, logados, auditados ou reexibidos;
   - audit logs ausentes, duplicados ou com payload sensível;
   - config revision/ETag/config environment state sendo bumpado indevidamente ou faltando;
   - controllers com business logic;
   - services muito grandes ou misturando validação, acesso, Prisma, audit e side effects;
   - tests ausentes para invariantes críticas;
   - módulos sem providers/exports corretos.
Depois me entregue um plano antes de editar:
- resumo do estado atual;
- lista priorizada de achados por risco/valor;
- top 3 próximas tasks recomendadas;
- escopo exato de arquivos por task;
- invariantes que não podem quebrar;
- comandos de verificação por task;
- riscos ou perguntas abertas.
Se eu disser “executa a task N”, implemente apenas essa task:
1. Faça a menor mudança correta.
2. Preserve padrões existentes do repo.
3. Não crie abstrações genéricas sem necessidade concreta.
4. Não toque arquivos não relacionados.
5. Mantenha controllers finos e services/use-cases como orquestradores.
6. Extraia helpers somente quando reduzirem responsabilidade real.
7. Atualize ou adicione testes focados em comportamento/invariantes.
8. Rode verificação direcionada primeiro e depois build/test mais amplo quando fizer sentido.
Regras importantes:
- Não armazenar, logar, auditar ou reexibir raw API tokens, raw SDK keys ou raw session tokens.
- `tokenHash`/`keyHash` nunca devem aparecer em responses/audit/read models públicos.
- Private APIs precisam passar por session/auth e `AccessService`.
- API tokens project-scoped não podem acessar recursos fora do projeto.
- SDK/public config deve preservar contrato, ETag/cache e lookup por hash.
- Fluxos que alteram config pública precisam preservar revision bump, ETag e audit.
- Se encontrar mudança não relacionada no worktree, ignore; se conflitar diretamente, pare e pergunte.
Formato da resposta de planejamento:
1. Estado Atual
2. Achados
3. Próxima Task Recomendada
4. Plano De Execução
5. Invariantes
6. Verificação
7. Backlog Depois Dessa

Não implemente nada até eu aprovar explicitamente.

???????????????
Se quiser uma versão mais direta para execução, troque a última linha por:
Depois do plano, implemente automaticamente a task de maior valor/menor risco, rode os testes direcionados e reporte o resultado.