import {HandlerBuilder} from '../../../common/domainFunctions/builder';
import {PresetCreateDto} from '../schema/preset-create-dto.schema';
import {PresetHandlerDependencies} from './';

export const create =
  HandlerBuilder.withDependencies<PresetHandlerDependencies>()
    .withName('createPreset')
    .withImplementation(({repository}) => {
      return (ownerId: string, data: PresetCreateDto) => {
        return repository.create({
          name: data.name,
          data: data.data,
          version: BigInt(1),
          ownerId: ownerId,
        });
      };
    })
    .build();

declare module '@api/domain' {
  interface DomainHandlerMap {
    createPreset: typeof create;
  }
}
