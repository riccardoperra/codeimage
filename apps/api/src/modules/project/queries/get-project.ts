import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Principal} from '../../../shared/principal.js';
import {type ProjectView, ProjectErrors, viewFor} from '../project.model.js';
import type {ProjectDependencies} from '../project.repository.js';
export const getProject = defineQuery<
  {viewer: Principal; id: string},
  ProjectView
>('project.getProject');
export default defineHandler(
  getProject,
  ({findProject}: ProjectDependencies) =>
    async ({viewer, id}) => {
      const project = await findProject(id);
      if (!project) throw ProjectErrors.notFound({id});
      return viewFor(project, viewer);
    },
);
