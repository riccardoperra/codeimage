import {Static, Type} from '@sinclair/typebox';
import {BaseProjectResponseSchema} from './project.schema';

export const ProjectDeleteResponseSchema = Type.Intersect(
  [BaseProjectResponseSchema],
  {
    $id: 'ProjectDeleteResponse',
    title: 'ProjectDeleteResponse',
  },
);

export type ProjectDeleteResponse = Static<typeof ProjectDeleteResponseSchema>;
