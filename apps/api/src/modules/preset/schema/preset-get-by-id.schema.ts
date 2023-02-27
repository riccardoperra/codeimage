import {Static, Type} from '@sinclair/typebox';
import {BaseResponse} from '../../../common/schemas/baserResponse';

export const BasePresetResponseSchema = Type.Object(
  {...BaseResponse, version: Type.Number()},
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
