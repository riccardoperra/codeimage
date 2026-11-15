# API architecture: modules without a bus

Target shape for `apps/api` and the path to it. The type sketch is in [`sketch/`](./sketch). `sketch/src` mirrors the target `apps/api/src`, `sketch/test` the target `apps/api/test`, and `sketch/later` illustrates the public API that is not part of this migration.

## Revision: commands and queries on a bus (owner decision, 2026-11-14)

The owner prefers use cases as commands and queries dispatched on a bus with middlewares, as in his work server and in the template. This revision replaces `<name>.service.ts` and overrides every "no bus" statement below. Everything else stands: contracts, owner-scoped repositories, the error catalog, the principal, `http/app-api.ts`, derived client types, the architecture test.

**What the bus buys here.** Every use case has one name and one entry point, callable from a route, another module, a job, or the future public API. Middlewares run around every use case, so logging, timing, and later tracing or auditing are written once. **What it costs.** One indirection between route and handler, and a registration step that can fail at boot.

**Shape.**

- `shared/bus.ts`. `defineCommand<Payload, Result>(name)` and `defineQuery<Payload, Result>(name)` return typed action creators. `createBus({middlewares})` returns `{register, execute}`. `register` throws on a duplicate name. `execute` throws on an unregistered name and returns the handler's typed result. Middlewares have the shape `(action, next) => Promise<unknown>` and compose in order. `plugins/bus.ts` decorates `fastify.commandBus` and `fastify.queryBus` with one logging middleware (name, duration, outcome).
- One file per use case, `modules/<m>/commands/<verb>-<noun>.ts` or `modules/<m>/queries/<verb>-<noun>.ts`. It exports the action creator and default-exports its handler built with `defineHandler(creator, (deps) => async payload => result)`. `defineHandler` returns a Fastify plugin that registers on the right bus, and exposes the factory so unit tests call the handler with fake deps and no Fastify.
- `modules/<m>/index.ts` builds the module's dependencies once (`{presets: createPresetRepository(fastify.db), limit: fastify.config.PRESETS_LIMIT}`) and autoloads `commands/` and `queries/` with those dependencies as plugin options. The repository is not a decorator, so routes cannot reach it. `index.ts` re-exports the action creators, the contract, and the routes. That is the module's public interface.
- Routes dispatch: `fastify.commandBus.execute(createPreset({actor: actorOf(request), draft: request.body}))`.
- Every payload of an owner-scoped use case carries `actor: Actor`. Handlers write only through `repository.ownedBy(actor.userId)`.
- No DI container, no event bus, no separate handler and command files, no bus metadata bag.

**Cost.** A new endpoint with one DB write adds 1 file (the command) and edits 3 (contract, repository, routes), plus tests. Tracing a request opens 3 files: routes, command, repository.

## Problem

`apps/api` is a 2,600 line Fastify 5 and Prisma 7 REST API with two modules built in two styles. `project` is a service closure that throws `@fastify/sensible` errors. `preset` runs on the home-made `HandlerBuilder` registry and throws exception classes. The goal is a structure that takes more modules and later a hosted public API, closer to DDD, without the ceremony of marcoturi/fastify-boilerplate.

The constraints pin the edges. The 12 routes under `/api/v1` keep their behavior, and the integration tests assert status codes, `code: 'NotFoundPresetException'`, and exact messages. The 11 type names in `@codeimage/api/api-types` are used by about 9 frontend files. The Auth0 and mock auth seams stay. Fastify, Prisma, TypeBox, ESM, tsdown `unbundle`, vitest, and `fastify start` on Railway stay. The work lands in steps, because the CLI and renderer plan (P5) edits the project schemas while this is in flight.

The defects the shape must make hard to repeat are all in today's code:

- `PUT /api/v1/project/:id` and `PUT /api/v1/project/:id/name` update `where: {id}` with no owner check. Any signed-in user can overwrite any project whose id they know, and project ids travel in share links. The fix exists on the local branch `fix/project-ownership-check` and is not on `main`.
- Three error styles: exception classes, injected `httpErrors`, and raw Prisma errors that surface as 500.
- Hand-synced lists that already drifted: the env schema and the config type, the `DomainHandlerMap` augmentations, `src/schemas/index.ts` and `api-types/index.d.ts`.
- `domain/` folders that hold only `Pick` and `Omit` aliases of Prisma types.
- Routes register before the modules they call, and one route calls a repository directly.

The next contributor is likely an agent that copies the nearest file. The right change has to be the shortest change that compiles.

## Usage (caller's view)

A module is one folder, `src/modules/<name>/`, with six role files. The rest of the app reaches it through one decorator, `fastify.<name>`. Clients see its contract.

| File | Owns | May import |
|---|---|---|
| `<name>.contract.ts` | TypeBox schemas and operations (method, url, schema, `auth`) | TypeBox, other contracts |
| `<name>.model.ts` | domain types, pure rules, the error catalog | its contract, `shared/{errors,principal}` |
| `<name>.repository.ts` | Prisma queries, row parsing, owner scoping | model, `shared/db` |
| `<name>.service.ts` | use cases, `create<Name>Service(deps)` | model, repository type |
| `<name>.routes.ts` | one `fastify.route({...op, handler})` per operation | contract, model, `shared/http` |
| `index.ts` | the Fastify plugin that wires and decorates | its own folder |

A route spreads a contract operation and calls the service. `request.body` and the return type are inferred from the contract.

```ts
// modules/preset/preset.routes.ts
fastify.route({
  ...op.update,
  handler: async request =>
    toPresetResponse(await fastify.preset.update(actorOf(request), request.params.id, request.body)),
});
```

A use case takes the actor first. Writes exist only behind `ownedBy`.

```ts
// modules/preset/preset.service.ts
async create(actor: Actor, draft: PresetDraft): Promise<Preset> {
  const mine = presets.ownedBy(actor.userId);
  if (exceedsPresetLimit(await mine.count(), limit)) throw PresetErrors.limitExceeded({limit});
  return mine.create(draft);
}
```

The frontend keeps its import. New names are derived, old names are aliases until the last step.

```ts
import type * as ApiTypes from '@codeimage/api/api-types';
type Body = ApiTypes.ProjectApi['update']['request']['body'];
type Same = ApiTypes.UpdateProjectApi['request']['body'];
```

Tests build a service with fakes, or the real app with config overrides.

```ts
const service = createPresetService({presets: inMemoryPresets(), limit: 1});
const app = await build(t, {config: {PRESETS_LIMIT: 1}});
```

## Shape

### Data structures

1. **Principal** (`shared/principal.ts`). `Principal = Actor | Anonymous`. An `Actor` carries a branded `UserId` and a `Credential`, which today has one variant, `{type: 'session'}`. Owner-scoped use cases take an `Actor`, so an anonymous caller cannot reach a write. The public API adds a credential variant here and no consumer of `Actor` changes.
2. **Owner-scoped repository.** `createXRepository(db)` exposes writes only under `ownedBy(owner: UserId)`, and every write keys on the `id_ownerId` compound unique. A missing row and a foreign row both come back as `null`, which the service turns into a 404. A project update that forgot the owner cannot be written, because no such method exists (per encode-lessons-in-structure).
3. **Operation** (`shared/contract.ts`). Plain data: `{method, url, schema, config: {auth}}`. Routes spread it, swagger documents it, and `ApiTypesOf<contract>` derives the client types.
4. **Error catalog** (`shared/errors.ts`). One `AppError` class with `code` and `kind`. Each module calls `defineErrors` to get typed factories. Business code picks a kind, and `plugins/errors.ts` holds the one table from kind to status and the one envelope, `{statusCode, error, message, code, requestId, details?}`, a superset of today's.

### Request flow

`app.ts` registers config, then the autoloaded `plugins/`, then each module, then `http/app-api.ts`. Routes always register after the services they call.

For a request, the `onRequest` hook in `http/app-api.ts` verifies the session and sets `request.principal`. Ajv validates against the contract schema. The handler in `<m>.routes.ts` calls `fastify.<m>.<op>(actorOf(request), ...)`. The service applies the rules from `<m>.model.ts` and calls `repository.ownedBy(actor.userId).<op>`, which runs Prisma and parses the row into a domain type. The 200 schema serializes the result as a whitelist, so `ownerId` never leaves the server. Any throw reaches `plugins/errors.ts` and returns the envelope.

### Load-bearing decisions

- **No bus.** Routes call service methods directly. Go-to-definition lands in the use case, and there is no runtime "handler not registered" failure (per laziness-protocol).
- **Decorators carry infrastructure, factories carry arguments.** Plugins decorate `fastify.db` and `fastify.config`. A module's `index.ts` reads them once and calls its factories. Services never see `fastify` (per boundary-discipline). This is decorator-only injection with one added rule, that decorators stop at `index.ts`.
- **One API is one encapsulated Fastify plugin.** `http/app-api.ts` owns the `/api/v1` prefix, the session hook, the OpenAPI document, and the registration of each module's routes. The public API will be a second file of the same kind with its own credential hook, document, and rate limit. No generic mounting mechanism exists.
- **Derive instead of sync.** The config type is `Static<ConfigSchema>`. Client types are `ApiTypesOf<contract>`. Service and repository types are `ReturnType<factory>`.
- **The client type closure is free of Fastify and Prisma.** `api-types.ts` reaches only contracts, `shared/contract.ts`, and TypeBox. The frontend can typecheck without `apps/api/dist` built first.
- **Boundaries are a test.** `test/architecture.test.ts` parses imports with the TypeScript compiler API and fails on a deep import into a module, Fastify or Prisma in a model or service, `db` access in a route, a stray file name in a module folder, or a module missing from one of the three registration lists.

### Interface depth

A module's runtime interface is one decorator with 5 to 7 methods that take an `Actor` and domain input and return domain output. Behind it sit owner scoping, row parsing, the preset limit rule, error codes, and the Prisma representation (BigInt, Json, nested relation writes). The shallow spot is that a few service methods only turn an actor into an owner scope and forward (project `list`, `create`). They stay so that routes never hold a data handle.

### What it does not do

No command or query bus, action creators, event bus, DI container, repository port interfaces, generic repository base, three-way mappers, AsyncLocalStorage transaction context, per-use-case folders, GraphQL, or Cucumber. No API-key storage, scopes, quotas, or rate limiting until the public API is real.

### Module map

```
apps/api/src/
  app.ts               composition root: config, plugins, modules, http/app-api
  server.ts            dev entry
  config.ts            TypeBox env schema, Config type, fastify.config, test overrides
  api-types.ts         <M>Api = ApiTypesOf<contract>, plus 11 frozen aliases
  plugins/             auth0 (verification only), db, errors, request-id, cors, health
  http/app-api.ts      /api/v1: session hook, OpenAPI, module routes
  shared/              contract, errors, principal, http, db
  modules/
    identity/          index, model, service, repository (owns users)
    project/           index, contract, model, service, repository, routes
    preset/            index, contract, model, service, repository, routes
apps/api/test/
  architecture.test.ts
  helpers/             app (build), auth0Mock, seed, fakes
  modules/<m>/<m>.service.test.ts
  routes/v1/<m>/<op>.integration.test.ts
  routes/ownership.integration.test.ts
```

### Per-feature cost

One new endpoint with one DB write in an existing module edits 4 source files and adds 1 test: the contract, the repository (inside `ownedBy`), the service, and the routes. No wiring changes. The client type appears as `PresetApi['<operation>']`. If the URL has a path param, the ownership test fails until the operation has a cross-user case or sits in the shared allowlist.

One new module adds 6 source files and 3 lines of wiring: `app.ts`, `http/app-api.ts`, and `api-types.ts`. The architecture test fails when any of the three is missing.

Tracing a request opens 3 files: routes, service, repository. Today the same request touches 10 to 12.

## Template verdict

The template's operations layer is production grade: graceful shutdown, one error envelope with stable codes and masked 5xx, liveness and readiness, env validation, request ids on every log line. Its API security layer is absent (no authentication, authorization, or rate limiting, CORS off, no DB timeouts). Its architecture layer is one CRUD module with a TODO subscriber, and `withTransaction` is never called from `src/`. Adding one endpoint there costs about 12 to 15 files.

| Template concept | Verdict here |
|---|---|
| Command and query bus, action creators, bus middlewares | Drop. Routes call service methods. |
| Event bus, domain events | Drop until a second module needs a side effect. Use an outbox table for anything that must not be lost. |
| Awilix, filename autoload, global `Dependencies` | Drop. Decorators plus explicit factory arguments. |
| Repository ports, SQL repository base | Simplify. Concrete owner-scoped repositories, type derived from the factory. |
| `toDomain` / `toPersistence` / `toResponse` mappers | Simplify. Row to domain in the repository, domain to wire only where shapes differ. |
| Domain module | Keep as `<m>.model.ts`: types, pure rules, errors. |
| Exception hierarchy, error handler, envelope | Keep, simplified to one `AppError` and one catalog per module. |
| Transaction context (AsyncLocalStorage) | Drop. A repository method that needs atomicity opens `db.$transaction`. |
| Per-use-case folders | Drop. One file per role per module, split a file past about 300 lines. |
| dependency-cruiser | Replace with `test/architecture.test.ts`, which also checks file layout and `db` access. |
| Env validation, request id | Keep. |
| Readiness, graceful shutdown | Keep readiness as `/ready` with `SELECT 1` when deploys need it. Verify fastify-cli's SIGTERM path. |
| Swagger with error refs | Keep, one document per API. |
| OTel bootstrap | Defer until a collector exists. |
| GraphQL, Cucumber, k6 | Drop. |

## Synthesis decision

Three candidates ran in parallel on three stances, and a cross-judge from another model family scored them on a six-point rubric.

- **Base: candidate A, functions-first modules** (Opus 5.5). It scored 19 of 30, against 18 for the command-bus slices and 15 for the framework-free core. Its owner-scoped repositories are concrete and inspectable, and it shipped an architecture test that runs.
- **Cut from A.** `defineModule`, `mountSurface`, the `surfaces/` folder, the per-operation `ownership` and `scopes` policy, the boot-time contract checks, the `api-key` credential, and the generated ownership matrix. They were machinery for a public API that does not exist, and A's author named them as the least certain decision. A module is now a plain Fastify plugin and an API is one plugin file.
- **Grafted from B, command-bus slices** (GPT-6.1 Sol). Preset `data` is typed as a JSON object, not cast to `PresetData`, because `PUT /preset/:id` does not validate it. B's own rationale conceded that its executor "does not buy distributed dispatch or greater testability than functions", which settled the bus question.
- **Grafted from C, framework-free core** (Fable 5.2). The public contract owns its response schemas and imports nothing from the app contract. C's `Db` allowlist was rejected: it exposed the `user` delegate, whose nested writes bypass the owner proof.
- **Fixed after judging.** The project contract is the real schemas moved verbatim, with the `Type.Required` wrappers that A dropped. `GET /project` keeps `frameId`, `terminalId`, and `editorOptionsId`. The `start:railway` script must pass `--options`, or fastify-cli ignores the exported server options.

## Tradeoffs accepted

- We accept thin service methods in exchange for one call path in which routes never hold a data handle.
- We accept that `fastify.db` stays a reachable decorator, guarded by the architecture test and not by types, in exchange for decorator-only injection.
- We accept about 280 lines of home-grown architecture test in exchange for no new tool and for rules an import-graph tool cannot express.
- We accept three hand-written registration lines per module, checked against the filesystem, in exchange for an explicit and readable composition root.
- We accept that a misspelled decorator key (`decorate('presets', ...)`) compiles, in exchange for dropping `defineModule`. A wrong value type still fails to compile, and the first integration test catches the misspelling.
- We accept a runtime `Value.Check` on preset responses in exchange for an honest type on stored preset data. It disappears if `PUT /preset/:id` starts validating (Q3).
- We accept that legacy codes keep their spelling (`NotFoundPresetException`) next to new upper snake case codes, in exchange for not changing a wire value that tests pin.
- We accept a 404, not a 403, for another user's row, in exchange for one code path and no existence oracle.
- We accept 11 deprecated type aliases until the last step, in exchange for not coupling the refactor to frontend edits while P5 is in flight.

## Alternatives considered

- **Use-case slices behind a typed command bus** (the shape of the owner's work server). It keeps a familiar idiom and one invocation convention across transports. It lost because the bus hides nothing here: one trigger (HTTP) exists, and the service functions are already transport-free. A bus becomes worth its cost when a second trigger arrives, such as a queue consumer, and it can then wrap the same service methods.
- **Framework-free core with thin transports and Prisma used directly behind a typed `Db` allowlist.** It had the lowest per-endpoint cost (2 files). It lost because the ownership guarantee rested on generic types over `Prisma.Args` that did not hold, and because it moved the whole composition boundary in one step.
- **Keep `routes/v1/**` as a URL-shaped tree next to modules.** Two trees per feature, registration order coupling, and any route can reach any decorator.
- **Services call Prisma directly, no repository.** Fewer files, but the owner scope becomes a habit repeated in every query. That is how `updateProjectName` lost it.
- **Prisma client extension or Postgres row-level security for ownership.** Hides the scope completely, and invisibly. It fights the deliberately shared project read.

## Open questions and risks

- **Q1.** Does the public API live in this process under `/public/v1`, or as its own service?
- **Q2.** Does the preset limit keep `count > limit` (an account can hold limit + 1) or become `>=`?
- **Q3.** Should `PUT /preset/:id` validate `data` against `PresetDataSchema`? It would turn today's "unknown id gets 404" test, which sends `{test: 'updated'}`, into a 400.
- **Q4.** Should `GET /project` stop returning `frameId`, `terminalId`, and `editorOptionsId`? No file in `apps/codeimage/src` reads them.
- **Q5.** Should Swagger UI at `/api-docs` stay public in production?
- **Q6.** Is "any signed-in user can clone any project" intended?
- **Q7.** Is `NODE_ENV=production` set on Railway, so that config can refuse `MOCK_AUTH=true` there?
- **Q8.** Is persisting `enableLigatures` on create a wanted fix? Today the DB default always wins.
- **R1.** Pointing the `api-types` `types` entry at source makes the frontend typecheck the contract files with its own compiler options. The fallback is `dist/api-types.d.mts`.
- **R2.** The `start:railway` script points at `dist/app.js` while tsdown emits `.mjs`. What Railway runs today is unverified.
- **R3.** `apps/codeimage` `dashboard.state.ts` types the project list as `GetProjectByIdApi['response'][]`, the full single-project shape. That will surface in step 7.
- **R4.** The project update looks up a tab by the submitted id but does not reuse that id on create, so repeating a `PUT` with a temporary tab id produces new tab ids each time. Decide and pin this with a test before step 6.

## Migration sequence

"API check" means `pnpm --filter @codeimage/api typecheck`, `test:unit`, and `test:integration`. Each step is one PR, and P5 can land between any two.

| # | Step | Deleted in the same step | Check |
|---|---|---|---|
| 0 | Land `fix/project-ownership-check`. Rewrite decorator spies in `test/routes/v1/**` as response and DB assertions, keeping every status, `code`, and message assertion. | `withFastifyApp`, `test/__internal__/`, `src/common/domainFunctions/handlers.test.ts` | API check green, cross-user `PUT`s return 404 |
| 1 | Config from one schema (`src/config.ts`, `AppOptions.config`). | The hand-written `FastifyInstance['config']`, unused required env keys | API check, boot with `.env.test` |
| 2 | One error model and request ids. Fix `start:railway`. | `common/exceptions/`, `plugins/errorHandler.ts`, `@fastify/sensible` | API check with today's assertions untouched, `build:ts` and import of `dist/app.mjs` |
| 3 | Contracts and derived client types. Legacy route files spread the operations. | `src/schemas/`, `api-types/index.d.ts`, `common/types/`, `modules/*/schema/`, `build:types` | API check, `rm -rf apps/api/dist` then frontend typecheck |
| 4 | Principal, identity module, `http/app-api.ts`. | `authorize`, `request.appUser`, user provisioning in `auth0.ts`, `plugins/swagger.ts` | API check, auth behavior tests (401, optional, provisioning, mock) |
| 5 | Preset in the new shape, plus the architecture test with a legacy allowlist. | `routes/v1/preset/`, old preset folders, `common/domainFunctions/`, `plugins/handler.ts`, the `@api/domain` alias | API check, architecture test, `rg "HandlerBuilder"` empty |
| 6 | Project in the new shape, plus the ownership test. | `src/routes/`, old project folders, `src/common/`, the legacy allowlist | API check, ownership test green, architecture test with no allowlist |
| 7 | Frontend to derived names. | The 11 frozen aliases | Frontend typecheck, API check |
| later | Public API: `http/public-api.ts`, a credential variant, `@fastify/rate-limit`, an OpenAPI snapshot test. | n/a | n/a |

## Verification of the sketch

- **Typecheck, measured.** `tsc` (TypeScript 6.0.2, strict, NodeNext) over `sketch/src`, `sketch/test`, and `sketch/later` exits 0 against Fastify 5.8.4, TypeBox 0.34.48, the TypeBox type provider 6.1.0, and the repo's generated Prisma client types.
- **Negative type cases, measured.** A handler with the wrong response shape, a repository write outside `ownedBy`, a raw string as `UserId`, and a decorator with the wrong value type each fail to compile.
- **Architecture test, measured.** 13 checks pass on the sketch. Seven injected violations (route importing a repository, four spellings of `db` access in a route, a deep import into another module, Fastify in a model, a stray `utils.ts`, an unregistered module, unregistered routes) each fail the intended check.
- **Ownership completeness check, measured.** Removing a case or adding an uncovered operation fails with the operation's name.
- **Not done.** No integration test ran. The sketch bodies are `not implemented`.

## Next implementation step

Step 0: put `fix/project-ownership-check` on `main`, then replace the decorator spies in `test/routes/v1/**` with response and database assertions, so every later step is checked against behavior and not wiring.
