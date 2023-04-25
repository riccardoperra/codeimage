import {Static, Type as t} from '@sinclair/typebox';
import {PresetDataSchema} from './preset-dto.schema';

export const PresetCreateDtoSchema = t.Object({
  name: t.String(),
  data: PresetDataSchema,
});

export type PresetCreateDto = Static<typeof PresetCreateDtoSchema>;
