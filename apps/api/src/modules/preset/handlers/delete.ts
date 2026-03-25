import {HandlerBuilder} from '../../../common/domainFunctions/builder.js';
import type {PresetHandlerDependencies} from './index.js';

export const remove =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('deletePreset')
    .withImplementation(({repository}, {handlers}) => {
      return async (userId: string, id: string) => {
        const preset = await handlers.findPresetById(userId, id);
        return repository.deletePreset(preset.id) as unknown;
      };
    })
    .build();

declare module '@api/domain' {
  interface DomainHandlerMap {
    deletePreset: typeof remove;
  }
}
