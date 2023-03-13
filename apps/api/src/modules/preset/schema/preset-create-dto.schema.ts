import {Static, Type as t} from '@sinclair/typebox';

export const PresetCreateDtoSchema = t.Object({
  name: t.String(),
  data: t.Object({}),
});

export type PresetCreateDto = Static<typeof PresetCreateDtoSchema>;
