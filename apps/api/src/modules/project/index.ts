import AutoLoad from '@fastify/autoload';
import fp from 'fastify-plugin';
import {join} from 'node:path';
import {createProjectRepository} from './project.repository.js';
export default fp(
  async fastify => {
    const dependencies = {projects: createProjectRepository(fastify.db)};
    for (const kind of ['commands', 'queries']) {
      await fastify.register(AutoLoad, {
        dir: join(import.meta.dirname, kind),
        options: dependencies,
        forceESM: true,
        ignorePattern: /\.d\.[cm]?ts$/,
      });
    }
  },
  {name: 'project', dependencies: ['db', 'bus']},
);
export {default as projectRoutes} from './project.routes.js';
export {projectContract} from './project.contract.js';
export {createProject} from './commands/create-project.js';
export {updateProject} from './commands/update-project.js';
export {renameProject} from './commands/rename-project.js';
export {removeProject} from './commands/remove-project.js';
export {cloneProject} from './commands/clone-project.js';
export {getProject} from './queries/get-project.js';
export {listProjects} from './queries/list-projects.js';
