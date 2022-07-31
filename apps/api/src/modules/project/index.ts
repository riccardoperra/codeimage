import {FastifyPluginAsync} from 'fastify';
import {makePrismaProjectRepository} from './infra/prisma/prisma-project.repository';
import {ProjectRepository} from './repository';
import * as projectSchemas from './schema';

export const project: FastifyPluginAsync = async fastify => {
  fastify.decorate(
    'projectRepository',
    makePrismaProjectRepository(fastify.prisma),
  );

  for (const schema of Object.values(projectSchemas)) {
    fastify.addSchema(schema);
  }
};

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepository;
  }
}

export default project;
