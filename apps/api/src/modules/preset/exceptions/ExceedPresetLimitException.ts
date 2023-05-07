import {UnprocessableEntityException} from '../../../common/exceptions/UnprocessableEntityException.js';

export class ExceedPresetLimitException extends UnprocessableEntityException<{
  limit: number;
}> {
  limit: number;

  constructor(options: {limit: number}) {
    super();
    this.limit = options.limit;
  }

  createMessage(): string {
    return `Preset limit per account exceeded`;
  }
}
