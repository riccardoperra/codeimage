import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Project,
  type ProjectChanges,
  ProjectErrors,
} from '../project.model.js';
import type {ProjectDependencies} from '../project.repository.js';
export const updateProject = defineCommand<
  {actor: Actor; id: string; changes: ProjectChanges},
  Project
>('project.updateProject');
export default defineHandler(
  updateProject,
  ({projects, scopeFor}: ProjectDependencies) =>
    async ({actor, id, changes}) => {
      const project = await projects.updateProject(
        scopeFor(actor.userId),
        id,
        changes,
      );
      if (!project) throw ProjectErrors.notFound({id});
      return project;
    },
);
