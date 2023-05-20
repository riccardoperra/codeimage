import {HandlerBuilder} from '../../../common/domainFunctions/builder.js';
import {ExceedPresetLimitException} from '../exceptions/ExceedPresetLimitException.js';
import {PresetCreateDto} from '../schema/preset-create-dto.schema.js';
import {PresetDto} from '../schema/preset-dto.schema.js';
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
          throw new ExceedPresetLimitException({limit: config.PRESETS_LIMIT});
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
