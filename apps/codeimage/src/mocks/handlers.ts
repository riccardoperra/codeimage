import {rest} from 'msw';
import {WorkspaceItem} from '../Dashboard';

export const handlers = [
  rest.get('/workspace', (req, res, ctx) => {
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
        {
          id: '5',
          name: 'Folder Typescript',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'folder',
        },
        {
          id: '3',
          name: 'Angular Proj 3',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'project',
        },
        {
          id: '4',
          name: 'Folder RxJS',
          createDate: Date.now().toString(),
          lastUpdateDate: Date.now().toString(),
          type: 'folder',
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
];
