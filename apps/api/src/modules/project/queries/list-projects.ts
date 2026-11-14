import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type ProjectSummary} from '../project.model.js';
import type {ProjectRepository} from '../project.repository.js';
export const listProjects = defineQuery<{actor: Actor}, ProjectSummary[]>(
  'project.listProjects',
);
export default defineHandler(
  listProjects,
  ({projects}: {projects: ProjectRepository}) =>
    async ({actor}) => {
      return projects.ownedBy(actor.userId).list();
    },
);
