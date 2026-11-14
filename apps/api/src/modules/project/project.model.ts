import {defineErrors} from '../../shared/errors.js';
export const ProjectErrors = defineErrors({
  notFound: {
    code: 'PROJECT_NOT_FOUND',
    kind: 'not_found',
    message: (p: {id: string}) => `Project with id ${p.id} not found`,
  },
  cloneSourceNotFound: {
    code: 'PROJECT_CLONE_SOURCE_NOT_FOUND',
    kind: 'not_found',
    message: (p: {id: string}) =>
      `Cannot clone project with id ${p.id} since it does not exists`,
  },
});
