import {Static, Type} from '@sinclair/typebox';
import {BaseResponse} from './project.schema';

const BasePresetResonseSchema = Type.Object(
  {...BaseResponse},
  {
    title: 'BasePresetResponse',
  },
);

export const PresetGetByIdResponseSchema = Type.Intersect([
  BasePresetResonseSchema,
  Type.Object({
    isOwner: Type.Boolean(),
  }),
]);

export type PresetCompleteResponse = Static<typeof PresetGetByIdResponseSchema>;
