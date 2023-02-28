import {HttpErrors} from '@fastify/sensible/lib/httpError';
import {PrismaClient} from '@prisma/client';
import {DomainHandlerRegistry} from '../../common/domainFunctions/registerHandlers';

export const {
  createHandler,
  resolveHandlers,
  prepareHandlers,
  createNamedHandler,
} = DomainHandlerRegistry.domain<{
  repository: PrismaClient;
  httpErrors: HttpErrors;
}>();