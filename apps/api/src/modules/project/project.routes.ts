import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {
  createProject,
  updateProject,
  renameProject,
  removeProject,
  cloneProject,
  listProjects,
  getProject,
} from './index.js';
import {actorOf} from '../../shared/http.js';
import {
  type ProjectGetByIdResponse,
  projectContract as op,
} from './project.contract.js';
import {
  changesFromUpdateBody,
  draftFromCreateBody,
  type ProjectView,
} from './project.model.js';

const projectRoutes: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,
    handler: request =>
      fastify.commandBus.execute(
        createProject({
          actor: actorOf(request),
          draft: draftFromCreateBody(request.body),
        }),
      ),
  });

  fastify.route({
    ...op.list,
    handler: request =>
      fastify.queryBus.execute(listProjects({actor: actorOf(request)})),
  });

  fastify.route({
    ...op.get,
    handler: async request =>
      toProjectResponse(
        await fastify.queryBus.execute(
          getProject({viewer: request.principal, id: request.params.id}),
        ),
      ),
  });

  fastify.route({
    ...op.update,
    handler: request =>
      fastify.commandBus.execute(
        updateProject({
          actor: actorOf(request),
          id: request.params.id,
          changes: changesFromUpdateBody(request.body),
        }),
      ),
  });

  fastify.route({
    ...op.updateName,
    handler: request =>
      fastify.commandBus.execute(
        renameProject({
          actor: actorOf(request),
          id: request.params.id,
          name: request.body.name,
        }),
      ),
  });

  fastify.route({
    ...op.remove,
    handler: request =>
      fastify.commandBus.execute(
        removeProject({actor: actorOf(request), id: request.params.id}),
      ),
  });

  fastify.route({
    ...op.clone,
    handler: request =>
      fastify.commandBus.execute(
        cloneProject({
          actor: actorOf(request),
          sourceId: request.params.id,
          newName: request.body.newName ?? null,
        }),
      ),
  });
};

export default projectRoutes;

export function toProjectResponse(view: ProjectView): ProjectGetByIdResponse {
  return {
    id: view.id,
    ownerId: view.ownerId,
    name: view.name,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
    frame: {
      id: view.frame.id,
      padding: view.frame.padding,
      visible: view.frame.visible,
      background: view.frame.background ?? '',
      opacity: view.frame.opacity,
      radius: view.frame.radius ?? 0,
    },
    terminal: {
      id: view.terminal.id,
      background: view.terminal.background ?? '',
      opacity: view.terminal.opacity,
      showHeader: view.terminal.showHeader,
      showGlassReflection: view.terminal.showGlassReflection,
      showWatermark: view.terminal.showWatermark,
      textColor: view.terminal.textColor ?? '',
      type: view.terminal.type,
      accentVisible: view.terminal.accentVisible,
      alternativeTheme: view.terminal.alternativeTheme,
      shadow: view.terminal.shadow,
      borderType: view.terminal.borderType,
    },
    editorOptions: {
      id: view.editorOptions.id,
      fontWeight: view.editorOptions.fontWeight,
      fontId: view.editorOptions.fontId,
      showLineNumbers: view.editorOptions.showLineNumbers,
      themeId: view.editorOptions.themeId,
      enableLigatures: view.editorOptions.enableLigatures,
    },
    editorTabs: view.editorTabs.map(editor => ({
      projectId: view.id,
      id: editor.id,
      languageId: editor.languageId,
      code: editor.code,
      tabName: editor.tabName,
      lineNumberStart: editor.lineNumberStart,
    })),
    isOwner: view.isOwner,
  };
}
