import fp from 'fastify-plugin';
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

export default fp(async fastify => {
  fastify.eventRegistry.add(findAllByUserId, {
    httpErrors: fastify.httpErrors,
    repository: fastify.projectRepository,
  });
});

declare module '@api/domain' {
  interface DomainHandler {
    findAllProjectsByUserId: ResolveHandler<typeof findAllByUserId>;
  }
}
