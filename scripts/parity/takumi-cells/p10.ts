import {
  createAmbientBackground,
  createWindowPalette,
} from '../../../apps/codeimage/src/components/Terminal/windowPalette';
import {type Cell, snapshot} from './snapshot';
export function p10Cells(fixtureUrl: string): Cell[] {
  const p10: Cell[] = [];
  for (const themeId of ['githubDark', 'githubLight']) {
    for (const type of ['card', 'editor', 'shell']) {
      for (const surface of ['solid', 'wash'])
        p10.push({
          name: `P10 ${type} ${themeId} ${surface}`,
          document: snapshot(themeId, {
            terminal: {type, surface},
            editor: {tabName: 'src/app/index.tsx'},
          }),
        });
    }
    p10.push({
      name: `P10 macOs ${themeId} wash hairline`,
      document: snapshot(themeId, {
        terminal: {surface: 'wash', borderType: 'hairline'},
      }),
    });
    for (const style of ['minimal', 'pill', 'card']) {
      for (const icon of [false, true])
        p10.push({
          name: `P10 ${style} ${themeId} icon-${icon}`,
          document: snapshot(themeId, {
            frame: {
              background: themeId === 'githubDark' ? '#121212' : '#f5f5f5',
              exportTarget: 'x-landscape',
              signature: {
                handle: 'octocat',
                name: 'Zoë Łukasz',
                style,
                platform: icon ? 'github' : null,
              },
            },
          }),
        });
    }
  }
  const card = {
    handle: 'octocat',
    name: 'The Octocat',
    style: 'card',
    platform: 'github',
    avatar: 'profile',
    position: 'bottom-center',
  };
  p10.push(
    {
      name: 'P10 card fixture avatar bottom-center',
      avatar: 'fixture',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'x-landscape', signature: card},
      }),
    },
    {
      name: 'P10 card offline initials',
      avatar: 'offline',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'x-landscape', signature: card},
      }),
    },
    ...['light', 'dark'].map(tone => ({
      name: `P10 signature over ${tone} image`,
      document: snapshot('githubDark', {
        frame: {
          background: `link:${fixtureUrl}/${tone}.png`,
          exportTarget: 'x-landscape',
          signature: {...card, avatar: null},
        },
      }),
    })),
    {
      name: 'P10 terminal alias',
      document: snapshot('githubDark', {
        terminal: {type: 'terminal', surface: 'wash'},
      }),
    },
    {
      name: 'P10 bare padding zero',
      document: snapshot('githubDark', {
        terminal: {type: 'card', showHeader: false},
        frame: {padding: 0, radius: 0},
      }),
    },
    {
      name: 'P10 ambient two tabs',
      document: (() => {
        const document = snapshot('githubDark', {
          frame: {
            background: createAmbientBackground(
              createWindowPalette({
                background: '#0d1117',
                text: '#c9d1d9',
                accent: '#58a6ff',
              }),
            ),
          },
          terminal: {type: 'editor', surface: 'wash'},
        });
        document.editor.editors.push({
          ...document.editor.editors[0],
          id: 'second',
          tabName: 'other.ts',
        });
        return document;
      })(),
    },
    {
      name: 'P10 square sixty lines',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'square', signature: {...card, avatar: null}},
        editor: {code: 'const value = 1;\n'.repeat(60)},
      }),
    },
  );
  return p10;
}
