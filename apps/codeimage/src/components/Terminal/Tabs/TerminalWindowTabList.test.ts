import type {BaseTerminalProps} from '../TerminalHost';
import {
  CardTerminal,
  EditorTerminal,
  ShellTerminal,
} from '../WindowStyles/WindowStyles';
import {createComponent} from 'solid-js';
import {renderToString} from 'solid-js/web';
import {expect, test, vi} from 'vitest';
import {TerminalWindowTabList} from './TerminalWindowTabList';
import type {TerminalWindowTabListProps} from './TerminalWindowTabList';

const fixture = vi.hoisted(() => ({
  tabs: [
    {
      id: 'first',
      code: 'one\ntwo',
      tab: {tabName: 'src/first.ts'},
      languageId: 'typescript',
    },
    {
      id: 'second',
      code: 'second',
      tab: {tabName: 'second.ts'},
      languageId: 'typescript',
    },
    {id: 'empty', tab: {tabName: null}, languageId: 'typescript'},
  ],
}));
vi.mock('@codeimage/store/editor', () => ({
  getRootEditorStore: () => ({
    state: {editors: fixture.tabs},
    computed: {selectedFont: () => ({name: 'monospace'})},
    isActive: (id: string) => id === 'first',
  }),
}));
vi.mock('./TabIcon/TabIcon', () => ({TabIcon: () => null}));
vi.mock('@codeimage/locale', () => ({
  useI18n: () => {
    throw Error('The Node renderer provides no translation context');
  },
}));
vi.mock('@codeimage/ui', () => ({
  Loading: () => null,
  Text: (props: {children: unknown}) => props.children,
}));
vi.mock('./Tab/DraggableWindowTab', () => ({
  DraggableWindowTab: () => {
    throw Error('Static exports must not create draggable tabs');
  },
}));
vi.mock('./TabAddButton/TabAddButton', () => ({
  TabAddButton: () => {
    throw Error('Static exports must not create add buttons');
  },
}));
vi.mock('../../Frame/FrameSkeleton', () => ({FrameSkeleton: () => null}));
vi.mock('./Tab/Tab.css', () => ({
  wrapper: () => 'tabs',
  tabListWrapper: 'list',
  tabTextContent: 'text',
  fallbackText: 'fallback',
  tabVars: {tabIndex: '--tab-index'},
}));
vi.mock('./Tab/WindowTabStyle.css', () => ({
  wrapper: 'tabs',
  list: 'list',
  tab: 'tab',
  text: 'text',
  mark: 'mark',
}));

const render = (props: Partial<TerminalWindowTabListProps>) =>
  renderToString(() =>
    createComponent(TerminalWindowTabList, {
      accent: false,
      readOnly: true,
      ...props,
    }),
  );

for (const appearance of ['card', 'editor', 'shell'] as const) {
  test(`${appearance} exports named tabs without browser-only drag or edit controls`, () => {
    const html = render({appearance});
    expect(html).toContain('src/first.ts');
    expect(html).toContain('second.ts');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<button');
    expect(html.includes('Untitled')).toBe(appearance === 'editor');
  });
}

test('only-active exports honour the explicit tab id instead of the live selection', () => {
  for (const appearance of ['card', 'editor', 'shell'] as const) {
    const html = render({
      appearance,
      showOnlyActiveTab: true,
      activeTabId: 'second',
    });
    expect(html).not.toContain('src/first.ts');
    expect(html).toContain('second.ts');
    expect(html).not.toContain('Untitled');
  }
});

test('only-active exports use the live selection when no explicit tab id is given', () => {
  const html = render({appearance: 'card', showOnlyActiveTab: true});
  expect(html).toContain('src/first.ts');
  expect(html).not.toContain('second.ts');
});

vi.mock('../TerminalHost', () => ({
  TerminalHost: (props: {children: unknown}) => props.children,
}));
vi.mock('../terminal.css', () => ({content: 'code-content'}));
vi.mock('../WindowStyles/WindowStyles.css', () => ({
  theme: 'theme',
  body: 'body',
  bar: 'bar',
  dots: 'dots',
  dot: 'dot',
  language: 'language',
  breadcrumb: 'breadcrumb',
  leaf: 'leaf',
  prompt: 'prompt',
  promptSign: 'sign',
  status: 'status',
  statusLanguage: 'status-language',
  mark: 'mark',
  codeBody: 'code-body',
}));

const terminal: BaseTerminalProps = {
  showHeader: true,
  readonlyTab: true,
  showTab: true,
  themeId: 'test',
  background: '#123456',
  textColor: '#fff',
  accentVisible: true,
  shadow: null,
  showWatermark: false,
  showGlassReflection: false,
  opacity: 100,
  alternativeTheme: false,
  borderType: 'hairline',
  surface: 'wash',
};

test('server-renders real editor facts for an explicit export tab', () => {
  const html = renderToString(() =>
    createComponent(EditorTerminal, {
      ...terminal,
      activeTabId: 'second',
      showOnlyActiveTab: true,
    }),
  );
  expect(html).toContain('second.ts');
  expect(html).toMatch(/\b1 line\b/);
  expect(html).not.toContain('src/first.ts');
  expect(html).not.toContain('breadcrumb');
});

test('server-renders breadcrumbs and line counts only from the active editor', () => {
  const html = renderToString(() => createComponent(EditorTerminal, terminal));
  expect(html).toContain('breadcrumb');
  expect(html).toContain('2 lines');
});

for (const component of [CardTerminal, EditorTerminal, ShellTerminal]) {
  test(`${component.name} hides its entire chrome with the header off`, () => {
    const html = renderToString(() =>
      createComponent(component, {...terminal, showHeader: false}),
    );
    expect(html).not.toContain('src/first.ts');
    expect(html).not.toContain('status');
    expect(html).not.toContain('cat ');
  });
}

test('an unnamed shell export has no decorative prompt', () => {
  const html = renderToString(() =>
    createComponent(ShellTerminal, {
      ...terminal,
      activeTabId: 'empty',
      showOnlyActiveTab: true,
    }),
  );
  expect(html).not.toContain('cat ');
  expect(html).not.toContain('Untitled');
});
