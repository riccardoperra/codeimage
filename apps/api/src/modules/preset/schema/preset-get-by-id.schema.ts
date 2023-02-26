import {Static, Type} from '@sinclair/typebox';
import {BaseResponse} from '../../project/schema/project.schema';

export const BasePresetResponseSchema = Type.Object(
  {...BaseResponse},
  {
    title: 'BasePresetResponse',
  },
);

export const PresetResponseSchema = Type.Intersect([
  BasePresetResponseSchema,
  Type.Object({
    isOwner: Type.Boolean(),
  }),
]);

export type PresetCompleteResponse = Static<typeof PresetResponseSchema>;
