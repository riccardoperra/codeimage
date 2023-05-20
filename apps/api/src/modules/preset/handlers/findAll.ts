import {HandlerBuilder} from '../../../common/domainFunctions/builder.js';
import {PresetDto} from '../schema/preset-dto.schema.js';
import {PresetHandlerDependencies} from './index.js';

export const findAll =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('findAllPresets')
    .withImplementation(({repository, mapper}) => {
      return async (ownerId: string): Promise<PresetDto[]> => {
        const preset = await repository.findAllByOwnerId(ownerId);
        return preset.map(mapper.fromEntityToDto);
      };
    })
    .build();

declare module '@api/domain' {
  interface DomainHandlerMap {
    findAllPresets: typeof findAll;
  }
}
