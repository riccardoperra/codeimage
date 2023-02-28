import {ProjectGetByIdResponse} from '../domain';
import {createNamedHandler} from '../handler';

export const findAllByUserId = createNamedHandler(
  'findAllProjectsByUserId',
  ({repository}) => {
    return async function findAllByUserId(
      userId: string,
    ): Promise<ProjectGetByIdResponse[]> {
      return repository.findAllByUserId(userId);
    };
  },
);

declare module '@api/domain' {
  interface DomainHandler {
    findAllProjectsByUserId: ResolveHandler<typeof findAllByUserId>;
  }
}
