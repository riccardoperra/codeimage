/**
 * Routes for /api/v1/project. One `fastify.route({...op, handler})` per contract operation.
 * Handlers translate HTTP into one service call and, where the wire shape differs from the domain
 * shape, one mapping function. No data access (architecture test), no business rules.
 */
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {actorOf} from '../../shared/http.js';
import {
  type ProjectGetByIdResponse,
  projectContract as op,
} from './project.contract.js';
import {changesFromUpdateBody, draftFromCreateBody, type ProjectView} from './project.model.js';

const projectRoutes: FastifyPluginAsyncTypebox = async fastify => {
  const projects = fastify.project;

  fastify.route({
    ...op.create,
    handler: request =>
      projects.create(actorOf(request), draftFromCreateBody(request.body)),
  });

  fastify.route({...op.list, handler: request => projects.list(actorOf(request))});

  fastify.route({
    ...op.get,
    // auth: 'optional' in the contract → request.principal may be anonymous.
    handler: async request =>
      toProjectResponse(await projects.get(request.principal, request.params.id)),
  });

  fastify.route({
    ...op.update,
    handler: request =>
      projects.update(
        actorOf(request),
        request.params.id,
        changesFromUpdateBody(request.body),
      ),
  });

  fastify.route({
    ...op.updateName,
    handler: request =>
      projects.updateName(actorOf(request), request.params.id, request.body.name),
  });

  fastify.route({
    ...op.remove,
    handler: request => projects.remove(actorOf(request), request.params.id),
  });

  fastify.route({
    ...op.clone,
    handler: request =>
      projects.clone(actorOf(request), request.params.id, request.body.newName ?? null),
  });
};

export default projectRoutes;

/**
 * Domain → GET /:id wire shape. Today's createCompleteProjectGetByIdResponseMapper: that response
 * promises non-null strings, so nullable columns become '' or 0. Exported for its unit test only.
 */
export function toProjectResponse(view: ProjectView): ProjectGetByIdResponse {
  // TODO: move get-project-by-id-mapper.ts body verbatim (background ?? '', radius ?? 0, textColor ?? '',
  // borderType narrowed to 'glass' | null, editorTabs with projectId), with isOwner = view.isOwner.
  void view;
  throw new Error('not implemented');
}
