import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetUpdateDto} from '../schema/preset-update-dto.schema';
import {PresetHandlerDependencies} from './';

export const update =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('updatePreset')
    .withImplementation(({repository}, {handlers}) => {
      return async (userId: string, id: string, data: PresetUpdateDto) => {
        await handlers.findPresetById(userId, id);
        // TODO: we should use the mapper
        return repository.update(id, data);
      };
    })
    .build();
