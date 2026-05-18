### AI DO NOT READ THIS FILE!

* i18n | study lib | local jsons always | pt-BR en-US Spanish
* AIOS
* user edit page


=====
I want to continue a round of technical improvement/refactor in the Capture Flag repository.
Goal: examine new and existing modules with senior engineering rigor, find coupling, services that are too large, responsibility leaks, test gaps, tenant/security/audit/config-state risks, and propose/implement small, safe, verifiable improvements.
First do a read-only phase:
1. Inspect `git status --short` and do not revert or alter existing changes.
2. Map modules in `apps/api/src`, controllers, DTOs, modules, facades/services, `use-cases`, `support`, guards, and nearby tests.
3. Identify newly created modules or modules with divergent architecture.
4. Compare the good patterns already used in the repo: thin controllers, native Nest modules, small use cases, support services for access/audit/input/read-model/credentials, local DTOs, and Vitest tests focused on behavior.
5. Look for specific risks:
   - tenant isolation by organization/project/config/environment;
   - reads/writes by global ID without resolving ownership;
   - raw credentials/tokens/SDK keys being persisted, logged, audited, or shown again;
   - missing or duplicated audit logs, or logs with sensitive payload;
   - config revision/ETag/config environment state being bumped incorrectly or missing;
   - controllers with business logic;
   - services that are too large or mix validation, access, Prisma, audit, and side effects;
   - missing tests for critical invariants;
   - modules without correct providers/exports.
Then deliver a plan before editing:
- summary of the current state;
- prioritized list of findings by risk/value;
- top 3 recommended next tasks;
- exact file scope per task;
- invariants that cannot break;
- verification commands per task;
- risks or open questions.
If I say "execute task N", implement only that task:
1. Make the smallest correct change.
2. Preserve existing repo patterns.
3. Do not create generic abstractions without a concrete need.
4. Do not touch unrelated files.
5. Keep controllers thin and services/use-cases as orchestrators.
6. Extract helpers only when they reduce real responsibility.
7. Update or add tests focused on behavior/invariants.
8. Run targeted verification first and then broader build/test when it makes sense.
Important rules:
- Do not store, log, audit, or show raw API tokens, raw SDK keys, or raw session tokens again.
- `tokenHash`/`keyHash` should never appear in public responses/audit/read models.
- Private APIs must go through session/auth and `AccessService`.
- Project-scoped API tokens cannot access resources outside the project.
- SDK/public config must preserve contract, ETag/cache, and hash lookup.
- Flows that alter public config must preserve revision bump, ETag, and audit.
- If you find an unrelated change in the worktree, ignore it; if it directly conflicts, stop and ask.
Planning response format:
1. Current State
2. Findings
3. Recommended Next Task
4. Execution Plan
5. Invariants
6. Verification
7. Backlog After This

Do not implement anything until I explicitly approve.

???????????????
If you want a more direct version for execution, replace the last line with:
After the plan, automatically implement the highest-value/lowest-risk task, run the targeted tests, and report the result.
