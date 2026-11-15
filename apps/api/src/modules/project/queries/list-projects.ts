import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type ProjectSummary} from '../project.model.js';
import type {ProjectDependencies} from '../project.repository.js';
export const listProjects = defineQuery<{actor: Actor}, ProjectSummary[]>(
  'project.listProjects',
);
export default defineHandler(
  listProjects,
  ({projects, scopeFor}: ProjectDependencies) =>
    async ({actor}) => {
      return projects.listProjects(scopeFor(actor.userId));
    },
);
