import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Project, type ProjectDraft} from '../project.model.js';
import type {ProjectRepository} from '../project.repository.js';
export const createProject = defineCommand<
  {actor: Actor; draft: ProjectDraft},
  Project
>('project.createProject');
export default defineHandler(
  createProject,
  ({projects}: {projects: ProjectRepository}) =>
    async ({actor, draft}) => {
      return projects.ownedBy(actor.userId).create(draft);
    },
);
