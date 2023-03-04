import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetCreateResponse} from '../domain';
import {PresetHandlerDependencies} from './';

export const findById =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('findPresetById')
    .withImplementation(({repository}) => {
      return async (
        ownerId: string,
        id: string,
      ): Promise<PresetCreateResponse> => {
        const preset = await repository.findById(id);
        if (!preset) {
          // TODO: add custom error
          throw new Error('not found');
          // throw httpErrors.notFound(`Preset with id ${id} not found`);
        }
        if (preset.ownerId !== ownerId) {
          // throw httpErrors.forbidden(
          //   'You are not allowed to access this preset',
          // );
        }
        // TODO: we should use the mapper
        return preset;
      };
    })
    .build();

declare module '@api/domain' {
  interface DomainHandlerMap {
    findPresetById: typeof findById;
  }
}
