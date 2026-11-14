/**
 * The project module. Wiring only: read infrastructure decorators once, call factories with explicit
 * arguments, decorate the service. Decorators stop here: the service never sees `fastify`.
 */
import fp from 'fastify-plugin';
import {createProjectRepository} from './project.repository.js';
import {createProjectService, type ProjectService} from './project.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Project module interface: the only way routes and other modules reach projects. */
    project: ProjectService;
  }
}

export default fp(
  async fastify => {
    fastify.decorate('project', createProjectService({projects: createProjectRepository(fastify.db)}));
  },
  {name: 'project', dependencies: ['db']},
);

// What other folders may import. Everything else in this folder is private (architecture test).
export {default as projectRoutes} from './project.routes.js';
export {projectContract} from './project.contract.js';
export type {ProjectService} from './project.service.js';
export type {Project, ProjectSummary, ProjectView} from './project.model.js';
