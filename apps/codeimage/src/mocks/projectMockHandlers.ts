import * as ApiTypes from '@codeimage/api/api-types';
import {randUuid} from '@ngneat/falso';
import {RequestHandler, rest} from 'msw';
import {db} from './db';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function getProjectByIdOrThrowNotFound(id: string, ownerId?: string) {
  const whereClause: Parameters<typeof db.project.findFirst>[0]['where'] = {};
  whereClause.id = {equals: id};
  if (ownerId) {
    whereClause.ownerId = {equals: ownerId};
  }

  try {
    const project = db.project.findFirst({
      where: whereClause,
    });
    return {
      data: project,
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: {
        error: 'Not Found',
        message: `Project with id ${id} not found`,
        statusCode: 404,
      },
    };
  }
}

const handlers: RequestHandler[] = [
  rest.get(`${BASE_URL}/api/v1/project`, (req, res, ctx) => {
    const ownerId = req.headers.get('auth-mock-user-id') ?? 'default-user';

    const projects = db.project.findMany({
      where: {
        ownerId: {equals: ownerId},
      },
    });

    return res(ctx.json(projects));
  }),
  rest.get(`${BASE_URL}/api/v1/project/:id`, (req, res, ctx) => {
    const id = req.params['id'] as string;
    const {data, error} = getProjectByIdOrThrowNotFound(id);
    if (error) {
      return res(ctx.status(404), ctx.json(error));
    }
    return res(ctx.json(data));
  }),
  rest.delete(`${BASE_URL}/api/v1/project/:id`, (req, res, ctx) => {
    const id = req.params['id'] as string;
    const ownerId = req.headers.get('auth-mock-user-id') ?? 'default-user';

    try {
      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return res(ctx.status(404), ctx.json(error));
      }
      const deleteResult = db.project.delete({
        where: {
          id: {equals: data?.id},
          ownerId: {equals: ownerId},
        },
      });
      return res(ctx.json(deleteResult));
    } catch (e) {
      return res(
        ctx.status(404),
        ctx.json({
          error: e,
        }),
      );
    }
  }),
  rest.put(`${BASE_URL}/api/v1/project/:id/name`, (req, res, ctx) => {
    const id = req.params['id'] as string;
    const body = req.body as ApiTypes.UpdateProjectNameApi['request']['body'];
    const ownerId = req.headers.get('auth-mock-user-id') ?? 'default-user';

    try {
      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return res(ctx.status(404), ctx.json(error));
      }
      const updateNameResult = db.project.update({
        data: {
          name: body?.name,
        },
        where: {
          id: {equals: data?.id},
          ownerId: {equals: ownerId},
        },
      });
      return res(ctx.json(updateNameResult));
    } catch (e) {
      return res(
        ctx.status(404),
        ctx.json({
          error: e,
        }),
      );
    }
  }),
  rest.put(`${BASE_URL}/api/v1/project/:id`, (req, res, ctx) => {
    const id = req.params['id'] as string;
    const body = req.body as ApiTypes.UpdateProjectApi['request']['body'];
    const ownerId = req.headers.get('auth-mock-user-id') ?? 'default-user';

    try {
      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return res(ctx.status(404), ctx.json(error));
      }
      const updateNameResult = db.project.update({
        data: {
          editorOptions: {
            fontId: body?.editorOptions.fontId,
            fontWeight: body?.editorOptions.fontWeight ?? 400,
            themeId: body?.editorOptions.themeId,
            showLineNumbers: body?.editorOptions.showLineNumbers ?? false,
          },
          frame: {
            background: body?.frame.background,
            opacity: body?.frame.opacity ?? 100,
            padding: body?.frame.padding ?? 32,
            radius: body?.frame.radius ?? 24,
            visible: body?.frame.visible ?? true,
          },
          isOwner: true,
          terminal: {
            opacity: body?.terminal.opacity ?? 100,
            shadow: body?.terminal.shadow,
            type: body?.terminal.type,
            textColor: body?.terminal.textColor ?? '',
            accentVisible: body?.terminal.accentVisible ?? true,
            alternativeTheme: body?.terminal.alternativeTheme ?? false,
            showGlassReflection: body?.terminal.showGlassReflection ?? false,
            showHeader: body?.terminal.showHeader ?? false,
            showWatermark: body?.terminal.showWatermark ?? false,
          },
          editorTabs: body?.editors.map(editor => ({
            id: editor.id,
            tabName: editor.tabName,
            languageId: editor.languageId,
            code: editor.code,
          })),
        },
        where: {
          id: {equals: data?.id},
          ownerId: {equals: ownerId},
        },
      });
      return res(ctx.json(updateNameResult));
    } catch (e) {
      return res(
        ctx.status(404),
        ctx.json({
          error: e,
        }),
      );
    }
  }),
  rest.post(`${BASE_URL}/api/v1/project`, (req, res, ctx) => {
    const body = req.body as ApiTypes.CreateProjectApi['request']['body'];
    const ownerId = req.headers.get('auth-mock-user-id') ?? 'default-user';

    const project = db.project.create({
      id: randUuid(),
      name: body?.name,
      ownerId: ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editorOptions: {
        id: randUuid(),
        fontId: body?.editorOptions.fontId,
        fontWeight: body?.editorOptions.fontWeight ?? 400,
        themeId: body?.editorOptions.themeId,
        showLineNumbers: body?.editorOptions.showLineNumbers ?? false,
      },
      frame: {
        id: randUuid(),
        background: body?.frame.background,
        opacity: body?.frame.opacity ?? 100,
        padding: body?.frame.padding ?? 32,
        radius: body?.frame.radius ?? 24,
        visible: body?.frame.visible ?? true,
      },
      isOwner: true,
      terminal: {
        id: randUuid(),
        opacity: body?.terminal.opacity ?? 100,
        shadow: body?.terminal.shadow,
        type: body?.terminal.type,
        textColor: body?.terminal.textColor ?? '',
        accentVisible: body?.terminal.accentVisible ?? true,
        alternativeTheme: body?.terminal.alternativeTheme ?? false,
        showGlassReflection: body?.terminal.showGlassReflection ?? false,
        showHeader: body?.terminal.showHeader ?? false,
        showWatermark: body?.terminal.showWatermark ?? false,
      },
      editorTabs: body?.editors.map(editor => ({
        id: randUuid(),
        tabName: editor.tabName,
        languageId: editor.languageId,
        code: editor.code,
      })),
    });
    return res(ctx.json(project));
  }),
  rest.post(`${BASE_URL}/api/v1/project/:id/clone`, (req, res, ctx) => {
    const id = req.params['id'] as string;
    const body = req.body as ApiTypes.CloneProjectApi['request']['body'];
    const ownerId = req.headers.get('auth-mock-user-id') ?? 'default-user';

    const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
    if (error) {
      return res(ctx.status(404), ctx.json(error));
    }
    if (data) {
      const {id, name, ...others} = data;

      return res(
        ctx.json(
          db.project.create({
            ...others,
            name: body?.newName ?? name,
            isOwner: true,
          }),
        ),
      );
    }
  }),
];

export default handlers;
