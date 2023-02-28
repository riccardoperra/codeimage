// import {HttpErrors} from '@fastify/sensible/lib/httpError';
// import {ProjectRepository} from '../../../../src/modules/project/repository';
//
import {HttpErrors} from '@fastify/sensible/lib/httpError';
import {ProjectMapper} from '../../../../src/modules/project/mapper';
import {createProjectRequestMapper} from '../../../../src/modules/project/mapper/create-project-mapper';
import {createCompleteProjectGetByIdResponseMapper} from '../../../../src/modules/project/mapper/get-project-by-id-mapper';
import {ProjectRepository} from '../../../../src/modules/project/repository';

export function makeMockProjectService() {
  const repository = {
    findById: () => void 0,
    findByUserId: () => void 0,
    create: () => void 0,
    createNewProject: () => void 0,
    update: () => void 0,
    delete: () => void 0,
  } as unknown as ProjectRepository;

  return {
    repository,
    httpErrors: {} as HttpErrors,
    mapper: {
      fromCreateRequestToDomainModel: createProjectRequestMapper,
      fromDomainToCompleteProjectResponse:
        createCompleteProjectGetByIdResponseMapper,
    } as ProjectMapper,
  };
}
