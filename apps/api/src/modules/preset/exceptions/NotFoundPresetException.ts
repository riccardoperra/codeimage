import {NotFoundEntityException} from '../../../common/exceptions/NotFoundEntityException';

type Params = {
  id: string;
  ownerId: string;
};

export class NotFoundPresetException extends NotFoundEntityException<Params> {
  createMessage({id, ownerId}: Params): string {
    return `Preset with id ${id} for user ${ownerId} not found`;
  }
}
