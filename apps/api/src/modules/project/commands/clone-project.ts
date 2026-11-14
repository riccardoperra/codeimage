import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Project, ProjectErrors, draftFromClone} from '../project.model.js';
import type {ProjectRepository} from '../project.repository.js';
export const cloneProject = defineCommand<
  {actor: Actor; sourceId: string; newName: string | null},
  Project
>('project.cloneProject');
export default defineHandler(
  cloneProject,
  ({projects}: {projects: ProjectRepository}) =>
    async ({actor, sourceId, newName}) => {
      const source = await projects.findById(sourceId);
      if (!source) throw ProjectErrors.cloneSourceNotFound({id: sourceId});
      return projects
        .ownedBy(actor.userId)
        .create(draftFromClone(source, newName));
    },
);
