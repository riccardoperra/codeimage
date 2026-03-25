import type * as ApiTypes from '@codeimage/api/api-types';
import {randUuid} from '@ngneat/falso';
import {HttpResponse, type RequestHandler} from 'msw';
import {http} from 'msw';
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
  } catch {
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

async function parseJsonBody<T>(request: Request): Promise<T | undefined> {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
}

const handlers: RequestHandler[] = [
  http.get(`${BASE_URL}/api/v1/project`, ({request}) => {
    const ownerId = request.headers.get('auth-mock-user-id') ?? 'default-user';

    const projects = db.project.findMany({
      where: {
        ownerId: {equals: ownerId},
      },
    });

    return HttpResponse.json(projects);
  }),
  http.get(`${BASE_URL}/api/v1/project/:id`, ({params}) => {
    const id = params['id'] as string;
    const {data, error} = getProjectByIdOrThrowNotFound(id);
    if (error) {
      return HttpResponse.json(error, {
        status: 404,
      });
    }
    return HttpResponse.json(data);
  }),
  http.delete(`${BASE_URL}/api/v1/project/:id`, ({request, params}) => {
    const id = params['id'] as string;
    const ownerId = request.headers.get('auth-mock-user-id') ?? 'default-user';

    try {
      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return HttpResponse.json(error, {status: 404});
      }
      const deleteResult = db.project.delete({
        where: {
          id: {equals: data?.id},
          ownerId: {equals: ownerId},
        },
      });
      return HttpResponse.json(deleteResult);
    } catch (e) {
      return HttpResponse.json(
        {
          error: e,
        },
        {status: 404},
      );
    }
  }),
  http.put(`${BASE_URL}/api/v1/project/:id/name`, async ({request, params}) => {
    const id = params['id'] as string;
    const body =
      await parseJsonBody<ApiTypes.UpdateProjectNameApi['request']['body']>(
        request,
      );
    const ownerId = request.headers.get('auth-mock-user-id') ?? 'default-user';

    try {
      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return HttpResponse.json(error, {status: 404});
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
      return HttpResponse.json(updateNameResult);
    } catch (e) {
      return HttpResponse.json(
        {
          error: e,
        },
        {status: 404},
      );
    }
  }),
  http.put(`${BASE_URL}/api/v1/project/:id`, async ({request, params}) => {
    const id = params['id'] as string;
    const body =
      await parseJsonBody<ApiTypes.UpdateProjectApi['request']['body']>(
        request,
      );
    const ownerId = request.headers.get('auth-mock-user-id') ?? 'default-user';

    try {
      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return HttpResponse.json(error, {status: 404});
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
      return HttpResponse.json(updateNameResult);
    } catch (e) {
      return HttpResponse.json(
        {
          error: e,
        },
        {status: 404},
      );
    }
  }),
  http.post(`${BASE_URL}/api/v1/project`, async ({request}) => {
    const body =
      await parseJsonBody<ApiTypes.CreateProjectApi['request']['body']>(
        request,
      );
    const ownerId = request.headers.get('auth-mock-user-id') ?? 'default-user';

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
    return HttpResponse.json(project);
  }),
  http.post(
    `${BASE_URL}/api/v1/project/:id/clone`,
    async ({request, params}) => {
      const id = params['id'] as string;
      const body =
        await parseJsonBody<ApiTypes.CloneProjectApi['request']['body']>(
          request,
        );
      const ownerId =
        request.headers.get('auth-mock-user-id') ?? 'default-user';

      const {data, error} = getProjectByIdOrThrowNotFound(id, ownerId);
      if (error) {
        return HttpResponse.json(error, {status: 404});
      }
      if (data) {
        const {id: _id, name, ...others} = data;

        return HttpResponse.json(
          db.project.create({
            ...others,
            name: body?.newName ?? name,
            isOwner: true,
          }),
        );
      }

      return HttpResponse.json(
        {
          error: 'Not Found',
          message: `Project with id ${id} not found`,
          statusCode: 404,
        },
        {status: 404},
      );
    },
  ),
];

export default handlers;
