import {Static, Type as t} from '@sinclair/typebox';

export const PresetUpdateDtoSchema = t.Object({
  name: t.String(),
  data: t.Object({}),
});

export type PresetUpdateDto = Static<typeof PresetUpdateDtoSchema>;
