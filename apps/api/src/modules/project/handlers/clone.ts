import {User} from '@codeimage/prisma-models';
import {ProjectNotFoundOnCloneError} from '../exceptions/projectCloneErrorException';
import {createHandler} from '../handler';
import {ProjectCreateResponse} from '../schema';

export default createHandler(({repository}, events) => {
  return async (
    user: User,
    projectId: string,
    newName: string | null,
  ): Promise<ProjectCreateResponse> => {
    const project = await repository.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundOnCloneError({id: projectId});
    }
    return events.createNewProject(user.id, {
      name: newName ?? project.name,
      frame: project.frame,
      editors: project.editorTabs,
      editorOptions: project.editorOptions,
      terminal: project.terminal,
    });
  };
});
