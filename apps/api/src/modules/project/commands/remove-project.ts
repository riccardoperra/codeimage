import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type ProjectHeader, ProjectErrors} from '../project.model.js';
import type {ProjectRepository} from '../project.repository.js';
export const removeProject = defineCommand<
  {actor: Actor; id: string},
  ProjectHeader
>('project.removeProject');
export default defineHandler(
  removeProject,
  ({projects}: {projects: ProjectRepository}) =>
    async ({actor, id}) => {
      const project = await projects.ownedBy(actor.userId).remove(id);
      if (!project) throw ProjectErrors.notFound({id});
      return project;
    },
);
