import {rest} from 'msw';
import {WorkspaceItem} from '../Dashboard';

export const handlers = [
  rest.get('/workspace', (req, res, ctx) => {
    return res(
      ctx.json<WorkspaceItem[]>(
        [
          {
            id: '4',
            name: 'Folder RxJS',
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
          ...new Array(100).fill(undefined).map((el, index) => {
            const type = Math.floor(Math.random() * 1 + 0.5)
              ? 'project'
              : 'folder';

            return {
              id: String(index + 30),
              name: type === 'project' ? `Project ${index}` : `Folder ${index}`,
              createDate: Date.now().toString(),
              lastUpdateDate: Date.now().toString(),
              type: type as any,
            };
          }),
        ].sort(a => (a.type === 'folder' ? -1 : 1)),
      ),
    );
  }),
];
