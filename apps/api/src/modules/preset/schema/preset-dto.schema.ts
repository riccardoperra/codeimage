import {Static, Type} from '@sinclair/typebox';

export const PresetDtoSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    version: Type.Number(),
  },
  {
    title: 'PresetResponse',
  },
);

export type PresetDto = Static<typeof PresetDtoSchema>;
