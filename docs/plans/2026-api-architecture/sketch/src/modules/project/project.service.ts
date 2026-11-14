/**
 * Project use cases. Framework-free: takes an Actor (or a Principal for the shared read), returns
 * domain types, throws catalog errors. Every owner-scoped call goes through `projects.ownedBy(actor.userId)`.
 */
import type {Actor, Principal} from '../../shared/principal.js';
import {
  draftFromClone,
  type Project,
  type ProjectChanges,
  type ProjectDraft,
  ProjectErrors,
  type ProjectHeader,
  type ProjectSummary,
  type ProjectView,
  viewFor,
} from './project.model.js';
import type {ProjectRepository} from './project.repository.js';

export interface ProjectServiceDeps {
  readonly projects: ProjectRepository;
}

export function createProjectService({projects}: ProjectServiceDeps) {
  return {
    /** Shared-link read. Anonymous viewers allowed; `isOwner` tells the editor whether to allow edits. */
    async get(viewer: Principal, id: string): Promise<ProjectView> {
      const project = await projects.findById(id);
      if (!project) throw ProjectErrors.notFound({id});
      return viewFor(project, viewer);
    },

    async list(actor: Actor): Promise<ProjectSummary[]> {
      return projects.ownedBy(actor.userId).list();
    },

    async create(actor: Actor, draft: ProjectDraft): Promise<Project> {
      return projects.ownedBy(actor.userId).create(draft);
    },

    /**
     * Ownership by construction: the only update the repository offers is on `ownedBy(actor.userId)`,
     * and it keys on `id_ownerId`. Another user's project id yields null → 404, and the row is untouched.
     */
    async update(actor: Actor, id: string, changes: ProjectChanges): Promise<Project> {
      const updated = await projects.ownedBy(actor.userId).update(id, changes);
      if (!updated) throw ProjectErrors.notFound({id});
      return updated;
    },

    /** Same construction as update. Today this ignored userId entirely. */
    async updateName(actor: Actor, id: string, name: string): Promise<ProjectHeader> {
      const renamed = await projects.ownedBy(actor.userId).updateName(id, name);
      if (!renamed) throw ProjectErrors.notFound({id});
      return renamed;
    },

    /** Today the route called the repository directly; a foreign id was a 500. */
    async remove(actor: Actor, id: string): Promise<ProjectHeader> {
      const removed = await projects.ownedBy(actor.userId).remove(id);
      if (!removed) throw ProjectErrors.notFound({id});
      return removed;
    },

    /** Read any project by link, write the copy under the actor. Not idempotent: each call is a new copy. */
    async clone(actor: Actor, sourceId: string, newName: string | null): Promise<Project> {
      const source = await projects.findById(sourceId);
      if (!source) throw ProjectErrors.cloneSourceNotFound({id: sourceId});
      return projects.ownedBy(actor.userId).create(draftFromClone(source, newName));
    },
  };
}

export type ProjectService = ReturnType<typeof createProjectService>;
