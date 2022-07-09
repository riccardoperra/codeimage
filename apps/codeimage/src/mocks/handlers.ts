import {rest} from 'msw';
import {WorkspaceItem} from '../Dashboard';

export const handlers = [
  rest.get('/workspace', (req, res, ctx) => {
    return res(
      ctx.json<WorkspaceItem[]>(
        [
          ...new Array(100).fill(undefined).map((el, index) => {
            const type = Math.floor(Math.random() * 1 + 0.5)
              ? 'project'
              : 'folder';

            return {
              id: String(index + 30),
              name: type === 'project' ? `Project ${index}` : `Folder ${index}`,
              createDate: Date.now().toString(),
              lastUpdateDate: Date.now().toString(),
              metadata:
                type === 'project'
                  ? {
                      frame: {
                        background:
                          'linear-gradient(135deg, #E233FF 0%, #FF6B00 100%)',
                        padding: 64,
                        radius: 24,
                        visible: true,
                        opacity: 100,
                        autoWidth: false,
                        scale: 0.5539772727272727,
                      },
                      terminal: {
                        showHeader: true,
                        type: 'macOs',
                        tabName: 'index.ts',
                        shadow: 'rgba(0, 0, 0, 0.60) 0px 45px 70px 4px ',
                        accentVisible: true,
                        background: '#0d1117',
                        textColor: '#c9d1d9',
                        darkMode: true,
                        showWatermark: true,
                        showGlassReflection: true,
                        opacity: 100,
                        alternativeTheme: false,
                      },
                      options: {
                        themeId: 'githubDark',
                        showLineNumbers: false,
                        fontId: 'jetbrains-mono',
                        fontWeight: 400,
                        focused: false,
                      },
                      editors: [
                        {
                          id: 'cl-31$399',
                          code: 'function Counter() {\\n  const [count, setCount] = createSignal(0);\\n  \\n  setInterval(\\n    () => setCount(count() + 1),\\n    1000\\n  );ddddd\\n\\n  return <div>The count is {count()}</div>\\n\\n}',
                          languageId: 'typescript',
                          tab: {tabName: 'Tab1.tsx'},
                        },
                        {
                          id: 'cl-42$1',
                          code: 'function Counter() {\\n  const [count, setCount] = createSignal(0);\\n  \\n  setInterval(\\n    () => setCount(count() + 1),\\n    1000\\n  );\\n\\n  return <div>The count is {count()}</div>\\n}\\n',
                          languageId: 'typescript',
                          tab: {tabName: 'app.component.ts'},
                        },
                        {
                          id: 'cl-62$1',
                          code: 'function Counter() {\\n  const [count, setCount] = createSignal(0);\\n  \\n  setInterval(\\n    () => setCount(count() + 1),\\n    1000\\n  );\\n\\n  return <div>The count is {count()}</div>\\n}\\n',
                          languageId: 'javascript',
                          tab: {tabName: 'app.component.js'},
                        },
                        {
                          id: 'cl-94$1',
                          code: 'function Counter() {\\n  const [count, setCount] = createSignal(0);\\n  \\n  setInterval(\\n    () => setCount(count() + 1),\\n    1000\\n  );\\n\\n  return <div>The count is {count()}</div>\\n}\\n',
                          languageId: 'css',
                          tab: {tabName: 'file.css'},
                        },
                      ],
                    }
                  : {},
              type: type as any,
            };
          }),
        ].sort(a => (a.type === 'folder' ? -1 : 1)),
      ),
    );
  }),
];
