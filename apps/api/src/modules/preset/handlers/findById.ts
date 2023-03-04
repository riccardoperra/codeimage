import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetDto} from '../schema/preset-get-by-id.schema';
import {PresetHandlerDependencies} from './';

export const findById =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('findPresetById')
    .withImplementation(({repository, mapper}) => {
      return async (ownerId: string, id: string): Promise<PresetDto> => {
        const preset = await repository.findById(id);
        if (!preset) {
          // TODO: add custom error
          throw new Error('not found');
          // throw httpErrors.notFound(`Preset with id ${id} not found`);
        }
        // TODO: not needed we will use findByIdAndOwnerId
        if (preset.ownerId !== ownerId) {
          // throw httpErrors.forbidden(
          //   'You are not allowed to access this preset',
          // );
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
