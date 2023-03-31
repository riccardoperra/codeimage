import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {ExceedPresetLimitException} from '../exceptions/ExceedPresetLimitException';
import {PresetCreateDto} from '../schema/preset-create-dto.schema';
import {PresetDto} from '../schema/preset-dto.schema';
import {PresetHandlerDependencies} from './';

export const create =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('createPreset')
    .withImplementation(({repository, mapper, config, logger}) => {
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
