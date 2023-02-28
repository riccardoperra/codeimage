import {User} from '@codeimage/prisma-models';
import {HttpError} from '@fastify/sensible/lib/httpError';
import {DomainHandlerRegistry} from '../../../common/domainFunctions/registerHandlers';
import {createHandler} from '../handler';
import {ProjectCreateResponse} from '../schema';
import createNewProject from './createNewProject';

export type CloneProjectHandler = (
  user: User,
  projectId: string,
  newName: string | null,
) => Promise<ProjectCreateResponse>;

export default createHandler<CloneProjectHandler>(
  ({repository, httpErrors}) => {
    return async (user, projectId, newName) => {
      try {
        const project = await repository.findById(projectId);
        if (!project) {
          throw {name: 'NotFoundError'} as HttpError;
        }
        return DomainHandlerRegistry.callHandler(createNewProject, user.id, {
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
  },
);

declare global {
  interface DomainHandler {
    'clone-project': CloneProjectHandler;
  }
}
