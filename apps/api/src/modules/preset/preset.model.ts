import {defineErrors} from '../../shared/errors.js';
export const PresetErrors = defineErrors({
  notFound: {
    code: 'NotFoundPresetException',
    kind: 'not_found',
    message: (p: {id: string; ownerId: string}) =>
      `Preset with id ${p.id} for user ${p.ownerId} not found`,
  },
  limitExceeded: {
    code: 'ExceedPresetLimitException',
    kind: 'unprocessable',
    message: (_: {limit: number}) => 'Preset limit per account exceeded',
  },
});
