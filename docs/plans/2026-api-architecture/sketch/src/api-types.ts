/**
 * `@codeimage/api/api-types`: the client type contract for apps/codeimage. Type-only.
 *
 * package.json:
 *   "exports": {"./api-types": {"types": "./src/api-types.ts", "default": "./api-types/index.js"}}
 * The `./schemas` export, src/schemas/index.ts and api-types/index.d.ts are deleted: no second list,
 * and no dependency on apps/api/dist existing before the frontend typechecks.
 *
 * Import closure (architecture test): this file, shared/contract.ts, modules/*\/*.contract.ts and
 * @sinclair/typebox. No Fastify, no Prisma, so the frontend compiles a handful of schema files, not
 * the server.
 *
 * Derivation: one line per module. A new operation in a contract appears here with no edit
 * (`PresetApi['newOperation']`). A new module adds one line; the architecture test fails until it does.
 */
import type {presetContract} from './modules/preset/preset.contract.js';
import type {projectContract} from './modules/project/project.contract.js';
import type {ApiTypesOf} from './shared/contract.js';

export type PresetApi = ApiTypesOf<typeof presetContract>;
export type ProjectApi = ApiTypesOf<typeof projectContract>;
export type {ErrorEnvelope} from './shared/contract.js';

// -------------------------------------------------------------------------------------------------
// Frozen aliases for today's 11 names (constraint 3). Derived, so they cannot drift. Never add to this
// list: new code uses ProjectApi['op'] / PresetApi['op']. Migration step 7 moves the ~9 consumer files
// in apps/codeimage to the derived names and deletes this block.
// -------------------------------------------------------------------------------------------------

/** @deprecated Use ProjectApi['create']. */
export type CreateProjectApi = ProjectApi['create'];
/** @deprecated Use ProjectApi['remove']. */
export type DeleteProjectApi = ProjectApi['remove'];
/** @deprecated Use ProjectApi['update']. */
export type UpdateProjectApi = ProjectApi['update'];
/** @deprecated Use ProjectApi['updateName']. */
export type UpdateProjectNameApi = ProjectApi['updateName'];
/** @deprecated Use ProjectApi['get']. */
export type GetProjectByIdApi = ProjectApi['get'];
/** @deprecated Use ProjectApi['clone']. */
export type CloneProjectApi = ProjectApi['clone'];
/** @deprecated Use PresetApi['create']. */
export type CreatePresetApi = PresetApi['create'];
/** @deprecated Use PresetApi['remove']. */
export type DeletePresetApi = PresetApi['remove'];
/** @deprecated Use PresetApi['get']. */
export type GetPresetByIdApi = PresetApi['get'];
/** @deprecated Use PresetApi['update']. */
export type UpdatePresetApi = PresetApi['update'];
/** @deprecated Use PresetApi['list']. */
export type GetAllPresetApi = PresetApi['list'];
