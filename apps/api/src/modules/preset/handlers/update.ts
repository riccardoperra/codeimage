import {HandlerBuilder} from '../../../common/domainFunctions/builder.js';
import type {PresetDto} from '../preset.contract.js';
import type {PresetUpdateDto} from '../preset.contract.js';
import type {PresetHandlerDependencies} from './index.js';

export const update =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('updatePreset')
    .withImplementation(({repository, mapper}, {handlers}) => {
      return async (
        userId: string,
        id: string,
        data: PresetUpdateDto,
      ): Promise<PresetDto> => {
        await handlers.findPresetById(userId, id);

        const updatedPreset = await repository.update(id, data);

        return mapper.fromEntityToDto(updatedPreset);
      };
    })
    .build();
