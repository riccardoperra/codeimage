import {Static, Type} from '@sinclair/typebox';
import {BaseProjectResponseSchema} from './project.schema';

export const ProjectDeleteResponseSchema = Type.Intersect(
  [BaseProjectResponseSchema],
  {
    title: 'ProjectDeleteResponse',
  },
);

export type ProjectDeleteResponse = Static<typeof ProjectDeleteResponseSchema>;
