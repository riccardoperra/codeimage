import {Static, Type} from '@sinclair/typebox';

export const BasePresetResponseSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    version: Type.Number(),
  },
  {
    title: 'BasePresetResponse',
  },
);

export const PresetResponseSchema = Type.Intersect([BasePresetResponseSchema]);

export type PresetDto = Static<typeof PresetResponseSchema>;
