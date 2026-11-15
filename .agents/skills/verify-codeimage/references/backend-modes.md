# Choose the backend for a verification run

## MSW

The bundled `verify.mjs` helper explicitly selects MSW and the Auth0 development adapter. It needs neither Docker nor a generated Prisma client. Its project persistence, authorization headers and delayed-start fixtures test the browser mock implementation.

Use this mode when Docker, API dependencies or an isolated database are unavailable. Report the backend as MSW. A successful run does not establish real API or PostgreSQL behavior.

## Real API and PostgreSQL

The repository also supports a real local API. Compose starts PostgreSQL only; it does not start the API. Prefer this path for backend integration when its prerequisites are available. Keep authentication mode explicit. `MOCK_AUTH=true` still mocks identity even though HTTP handlers and PostgreSQL are real.

Before starting a run, inspect these sources:

- `apps/api/docker-compose.dev.yml` defines PostgreSQL 18 services `db` on host 5432 and `test_db` on 5433.
- `apps/api/prisma/schema.prisma` generates the client in `packages/prisma-models/generated/client`.
- `apps/api/prisma.config.ts` reads `DATABASE_URL` for migrations.
- `apps/api/src/config.ts` defines required configuration and the optional development identity.
- `apps/api/src/server.ts` uses `HOST` and `PORT`, defaulting to port 3000.
- `scripts/make-env.ts` and `CONTRIBUTING.md` describe the local setup.

Check `docker info` and `docker compose version`. Check the intended ports and whether the generated Prisma client exists. Use a run-owned Compose project, override its database port if needed, and start only the needed database service. Do not migrate, reset or remove an existing shared database just because it is reachable. The checked-in Compose services do not define database health checks; wait for `pg_isready` and completed migrations.

From the repository root, generate the client with `pnpm --filter=@codeimage/api exec prisma generate`, then build `@codeimage/prisma-models`. Apply `pnpm --filter=@codeimage/api prisma:migrate:deploy` with `DATABASE_URL` pointing only at the isolated run database. Keep the generated client and library setup serial with other workspace builds.

Launch the API with `pnpm dev:api`. Required environment fields are `DATABASE_URL`, `DOMAIN_AUTH0`, `AUDIENCE_AUTH0`, `AUTH0_CLIENT_CLAIMS` and `ALLOWED_ORIGINS`. For a local development identity, also set `MOCK_AUTH=true` and a unique `MOCK_AUTH_EMAIL`. URL-valued fields must satisfy the schema even in development-auth mode. `scripts/make-env.ts` shows the repository's development values.

Launch the frontend with `VITE_ENABLE_MSW=false`, the chosen frontend authentication configuration and `VITE_API_BASE_URL` pointing at that API. The default Vite proxy targets port 3000; use the explicit base URL if the API uses another port. The bundled helper currently forces MSW, so it is not the launcher for this mode. Reuse its UI recipes against the separately owned frontend instance.

The doctor must check `/health`, a usable authenticated `/api/v1/project` response and the rendered app. Confirm requests reach the real API and no MSW worker is active. Verify persisted rows or API read-back after reload. Do not run the MSW-only delayed-start and `auth-mock-user-id` fixtures against the real API. Real authorization needs separately configured identities.

Keep process IDs, Compose project identity and evidence for this run. Teardown only the API/frontend processes and database resources created by this run. Preserve the trace, HTTP evidence and row checks. Never run a blanket Compose teardown against the user's existing project.

## Upgrade precondition

Compare the running server major version and mounted data directory with the Compose image. An old PostgreSQL 13 container or volume is not a PostgreSQL 18 instance merely because Compose now names 18. Recreate a disposable test instance with fresh storage when authorized, or use a new isolated project. Do not delete an existing volume without confirming its identity and data-loss scope.

The bundled automation currently proves MSW mode. The real API procedure here is source-grounded setup guidance; it still needs an actual API/PostgreSQL run before claiming integration coverage.
