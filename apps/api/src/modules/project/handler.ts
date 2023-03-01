import {DomainHandlerRegistry} from '../../common/domainFunctions/registerHandlers';
import {ProjectMapper} from './mapper';
import {ProjectRepository} from './repository';

export const {createHandler, resolveHandlers, createNamedHandler} =
  DomainHandlerRegistry.forModule<{
    repository: ProjectRepository;
    mapper: ProjectMapper;
  }>();
