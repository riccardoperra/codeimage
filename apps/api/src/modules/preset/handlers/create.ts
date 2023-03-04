import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetCreateRequest} from '../domain';
import {PresetHandlerDependencies} from './';

export const create =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('createPreset')
    .withImplementation(({repository}) => {
      return (ownerId: string, data: Omit<PresetCreateRequest, 'ownerId'>) => {
        return repository.create({...data, ownerId});
      };
    })
    .build();
