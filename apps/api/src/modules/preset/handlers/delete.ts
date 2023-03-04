import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetHandlerDependencies} from './';

export const remove =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('deletePreset')
    .withImplementation(({repository}, {handlers}) => {
      return async (userId: string, id: string) => {
        const preset = await handlers.findPresetById(userId, id);
        return repository.deletePreset(preset.id);
      };
    })
    .build();
