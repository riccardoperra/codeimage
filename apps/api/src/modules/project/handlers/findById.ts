import {createHandler} from '../handler';
import {ProjectGetByIdResponse} from '../schema';

export default createHandler(({repository}) => {
  return async function findAllByUserId(
    userId: string,
  ): Promise<ProjectGetByIdResponse[]> {
    return repository.findAllByUserId(userId);
  };
});
