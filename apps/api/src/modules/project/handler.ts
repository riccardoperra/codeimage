import {HttpErrors} from '@fastify/sensible/lib/httpError';
import {PrismaClient} from '@prisma/client';
import {DomainHandlerRegistry} from '../../common/domainFunctions/registerHandlers';
import {ProjectMapper} from './mapper';

export const {
  createHandler,
  resolveHandlers,
  prepareHandlers,
  createNamedHandler,
} = DomainHandlerRegistry.forModule<{
  repository: PrismaClient;
  httpErrors: HttpErrors;
  mapper: ProjectMapper;
}>('project');
