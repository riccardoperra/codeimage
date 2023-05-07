import {HandlerBuilder} from '../../../common/domainFunctions/builder.js';
import {NotFoundPresetException} from '../exceptions/NotFoundPresetException.js';
import {PresetDto} from '../schema/preset-dto.schema.js';
import {PresetHandlerDependencies} from './index.js';

export const findById =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('findPresetById')
    .withImplementation(({repository, mapper}) => {
      return async (ownerId: string, id: string): Promise<PresetDto> => {
        const preset = await repository.findByIdAndOwnerId(id, ownerId);
        if (!preset) {
          throw new NotFoundPresetException({id, ownerId});
        }
        return mapper.fromEntityToDto(preset);
      };
    })
    .build();

declare module '@api/domain' {
  interface DomainHandlerMap {
    findPresetById: typeof findById;
  }
}
