import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type ProjectHeader, ProjectErrors} from '../project.model.js';
import type {ProjectDependencies} from '../project.repository.js';
export const renameProject = defineCommand<
  {actor: Actor; id: string; name: string},
  ProjectHeader
>('project.renameProject');
export default defineHandler(
  renameProject,
  ({projects, scopeFor}: ProjectDependencies) =>
    async ({actor, id, name}) => {
      const project = await projects.renameProject(
        scopeFor(actor.userId),
        id,
        name,
      );
      if (!project) throw ProjectErrors.notFound({id});
      return project;
    },
);
