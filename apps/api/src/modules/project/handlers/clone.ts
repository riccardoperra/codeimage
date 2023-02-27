import {User} from '@codeimage/prisma-models';
import {HttpError} from '@fastify/sensible/lib/httpError';
import {createHandler} from '../handler';
import {ProjectCreateResponse} from '../schema';
import createNewProject from './createNewProject';

export default createHandler(({repository, httpErrors}) => {
  return async (
    user: User,
    projectId: string,
    newName: string | null,
  ): Promise<ProjectCreateResponse> => {
    try {
      const project = await repository.findById(projectId);
      if (!project) {
        throw {name: 'NotFoundError'} as HttpError;
      }
      return createNewProject({repository, httpErrors})(user.id, {
        name: newName ?? project.name,
        frame: project.frame,
        editors: project.editorTabs,
        editorOptions: project.editorOptions,
        terminal: project.terminal,
      });
    } catch (e) {
      const error = e as HttpError;
      if (error && error.name === 'NotFoundError') {
        throw httpErrors.notFound(
          `Cannot clone project with id ${projectId} since it does not exists`,
        );
      }
      throw e;
    }
  };
});
