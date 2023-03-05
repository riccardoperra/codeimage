import {Static, Type} from '@sinclair/typebox';
import {BigNumber} from '../../../common/typebox/bigInt';

export const PresetDtoSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    version: BigNumber(),
  },
  {
    title: 'PresetResponse',
  },
);

export type PresetDto = Static<typeof PresetDtoSchema>;
