import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetCreateRequest} from '../domain';
import {PresetHandlerDependencies} from './';

export const update =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('updatePreset')
    .withImplementation(({repository}, {handlers}) => {
      return async (userId: string, id: string, data: PresetCreateRequest) => {
        await handlers.findPresetById(userId, id);
        // TODO: we should use the mapper
        return repository.update(id, data);
      };
    })
    .build();
