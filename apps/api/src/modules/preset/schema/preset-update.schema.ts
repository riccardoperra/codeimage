import {Type} from '@sinclair/typebox';

export const PresetBaseRequestSchema = Type.Object(
  {
    name: Type.String(),
    data: Type.Record(Type.String(), Type.Any()),
  },
  {
    title: 'PresetUpdateRequest',
  },
);
