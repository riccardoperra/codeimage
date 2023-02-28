import {User} from '@codeimage/prisma-models';
import {DomainHandlerRegistry} from '../../../common/domainFunctions/registerHandlers';
import {createHandler} from '../handler';
import {ProjectCreateResponse} from '../schema';
import createNewProject from './createNewProject';
import {ProjectNotFoundOnCloneError} from '../exceptions/projectCloneErrorException';

export default createHandler(({repository}) => {
  return async (
    user: User,
    projectId: string,
    newName: string | null,
  ): Promise<ProjectCreateResponse> => {
    const project = await repository.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundOnCloneError({id: project});
    }
    return DomainHandlerRegistry.callHandler(createNewProject, user.id, {
      name: newName ?? project.name,
      frame: project.frame,
      editors: project.editorTabs,
      editorOptions: project.editorOptions,
      terminal: project.terminal,
    });
  };
});
