import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetDto} from '../schema/preset-dto.schema';
import {PresetHandlerDependencies} from './';

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
