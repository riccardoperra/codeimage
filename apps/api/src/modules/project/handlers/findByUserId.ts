import {ProjectGetByIdResponse} from '../domain';
import {createHandler} from '../handler';

export default createHandler(({repository}) => {
  return async function findAllByUserId(
    userId: string,
  ): Promise<ProjectGetByIdResponse[]> {
    return repository.findAllByUserId(userId);
  };
});
