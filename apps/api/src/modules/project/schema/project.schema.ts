import {Type} from '@sinclair/typebox';

export const BaseProjectResponseSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.String({format: 'date-time'}),
    updatedAt: Type.String({format: 'date-time'}),
    userId: Type.String({format: 'uuid'}),
  },
  {
    $id: 'BaseProjectResponse',
    title: 'BaseProjectResponse',
  },
);
