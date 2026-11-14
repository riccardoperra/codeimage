import {HandlerBuilder} from '../../../common/domainFunctions/builder.js';
import {PresetErrors} from '../preset.model.js';
import type {PresetCreateDto} from '../preset.contract.js';
import type {PresetDto} from '../preset.contract.js';
import type {PresetHandlerDependencies} from './index.js';

export const create =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('createPreset')
    .withImplementation(({repository, mapper, config}) => {
      return async (
        ownerId: string,
        data: PresetCreateDto,
      ): Promise<PresetDto> => {
        const count = repository.countByOwnerId(ownerId);
        if (config.PRESETS_LIMIT && (await count) > config.PRESETS_LIMIT) {
          throw PresetErrors.limitExceeded({limit: config.PRESETS_LIMIT});
        }

        const createdPreset = await repository.create({
          name: data.name,
          data: data.data,
          version: BigInt(1),
          ownerId: ownerId,
        });

        return mapper.fromEntityToDto(createdPreset);
      };
    })
    .build();

declare module '@api/domain' {
  interface DomainHandlerMap {
    createPreset: typeof create;
  }
}
