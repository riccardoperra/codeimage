/**
 * Preset use cases: one factory, deps as explicit arguments, plain async methods.
 * Framework-free (architecture test): no Fastify, no request, no Prisma. Routes call these directly;
 * other modules call them through `fastify.preset`.
 */
import type {Actor} from '../../shared/principal.js';
import {
  exceedsPresetLimit,
  type Preset,
  type PresetChanges,
  type PresetDraft,
  PresetErrors,
} from './preset.model.js';
import type {PresetRepository} from './preset.repository.js';

export interface PresetServiceDeps {
  readonly presets: PresetRepository;
  /** PRESETS_LIMIT, read once at boot from fastify.config by modules/preset/index.ts. */
  readonly limit: number;
}

export function createPresetService({presets, limit}: PresetServiceDeps) {
  return {
    /**
     * Create a preset for the actor, refusing when the account is over the limit.
     *
     * Not atomic, as today: two concurrent creates can both pass the count. If that ever matters, the
     * fix is one repository method running count + insert in `db.$transaction` with this same predicate,
     * not a transaction context threaded through the service.
     * Not idempotent: a retried POST creates a second preset.
     */
    async create(actor: Actor, draft: PresetDraft): Promise<Preset> {
      const mine = presets.ownedBy(actor.userId);

      const existing = await mine.count();
      if (exceedsPresetLimit(existing, limit)) {
        throw PresetErrors.limitExceeded({limit});
      }

      // The repository returns a domain Preset (version already a number). The route maps it to the
      // wire shape; PresetSchema is the response whitelist, so ownerId never reaches the wire.
      return mine.create(draft);
    },

    async list(actor: Actor): Promise<Preset[]> {
      return presets.ownedBy(actor.userId).list();
    },

    async get(actor: Actor, id: string): Promise<Preset> {
      const preset = await presets.ownedBy(actor.userId).get(id);
      if (!preset) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return preset;
    },

    /** One owner-keyed write. Replaces today's findPresetById-then-update-by-id. */
    async update(actor: Actor, id: string, changes: PresetChanges): Promise<Preset> {
      void [actor, id, changes];
      throw new Error('not implemented');
      // TODO: const updated = await presets.ownedBy(actor.userId).update(id, changes);
      //       if (!updated) throw PresetErrors.notFound({id, ownerId: actor.userId});
      //       return updated;
    },

    /** Returns the deleted preset (today's response body). */
    async remove(actor: Actor, id: string): Promise<Preset> {
      void [actor, id];
      throw new Error('not implemented');
      // TODO: same shape as update, with presets.ownedBy(actor.userId).remove(id).
    },
  };
}

/** Derived from the factory: the interface cannot drift from the implementation. */
export type PresetService = ReturnType<typeof createPresetService>;
