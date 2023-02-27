import {createHandler} from '../handler';

export default createHandler(({repository}) => {
  return async function updateName(
    userId: string,
    projectId: string,
    newName: string,
  ) {
    return repository.updateProjectName(projectId, newName);
  };
});
