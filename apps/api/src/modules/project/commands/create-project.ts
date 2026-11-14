import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Project, type ProjectDraft} from '../project.model.js';
import type {ProjectDependencies} from '../project.repository.js';
export const createProject = defineCommand<
  {actor: Actor; draft: ProjectDraft},
  Project
>('project.createProject');
export default defineHandler(
  createProject,
  ({projects, scopeFor}: ProjectDependencies) =>
    async ({actor, draft}) => {
      return projects.createProject(scopeFor(actor.userId), draft);
    },
);
