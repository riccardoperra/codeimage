import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type ProjectHeader, ProjectErrors} from '../project.model.js';
import type {ProjectRepository} from '../project.repository.js';
export const renameProject = defineCommand<
  {actor: Actor; id: string; name: string},
  ProjectHeader
>('project.renameProject');
export default defineHandler(
  renameProject,
  ({projects}: {projects: ProjectRepository}) =>
    async ({actor, id, name}) => {
      const project = await projects.ownedBy(actor.userId).updateName(id, name);
      if (!project) throw ProjectErrors.notFound({id});
      return project;
    },
);
