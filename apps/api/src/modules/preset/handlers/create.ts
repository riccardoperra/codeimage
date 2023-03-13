import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetCreateDto} from '../schema/preset-create-dto.schema';
import {PresetDto} from '../schema/preset-dto.schema';
import {PresetHandlerDependencies} from './';

export const create =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('createPreset')
    .withImplementation(({repository, mapper}) => {
      return async (
        ownerId: string,
        data: PresetCreateDto,
      ): Promise<PresetDto> => {
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
