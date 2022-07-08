import {rest} from 'msw';
import {WorkspaceItem} from '../Dashboard';

export const handlers = [
  rest.get('/workspace/folders', (req, res, ctx) => {
    return res(
      ctx.json<WorkspaceItem[]>([
        {
          id: '4',
          name: 'Folder RxJS',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'folder',
        },
        {
          id: '5',
          name: 'Folder Typescript',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'folder',
        },
        {
          id: '6',
          name: 'Folder Angular',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'folder',
        },
      ]),
    );
  }),
  rest.get('/workspace/folders/4', async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 1250));

    return res(
      ctx.json<WorkspaceItem[]>([
        {
          id: '1',
          name: 'Angular Proj 1',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
        {
          id: '2',
          name: 'Angular Proj 2',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
      ]),
    );
  }),
  rest.get('/workspace/folders/5', async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 1250));
    return res(
      ctx.json<WorkspaceItem[]>([
        {
          id: '3',
          name: 'Angular Proj 3',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
        {
          id: '6',
          name: 'SolidJS content',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
        {
          id: '7',
          name: 'svelte content',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
        {
          id: '8',
          name: 'bun.sh test',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
      ]),
    );
  }),
  rest.get('/workspace/folders/6', async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 1250));
    return res(
      ctx.json<WorkspaceItem[]>([
        {
          id: '12',
          name: 'Solid',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
      ]),
    );
  }),
];
