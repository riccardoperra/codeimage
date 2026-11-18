import {createComponent} from 'solid-js';
import {renderToString} from '@solidjs/web';
import {expect, test, vi} from 'vitest';
import {TerminalWindowTabList} from './TerminalWindowTabList';

vi.mock('@codeimage/store/editor', () => ({
  getRootEditorStore: () => ({
    state: {
      editors: [
        {id: 'first', tab: {tabName: 'first.ts'}, languageId: 'typescript'},
        {id: 'second', tab: {tabName: 'second.ts'}, languageId: 'typescript'},
      ],
    },
    actions: {},
    computed: {canAddEditor: () => true},
    isActive: (id: string) => id === 'first',
  }),
}));
vi.mock('@codeimage/locale', () => ({
  useI18n: () => {
    throw Error('The Node renderer provides no translation context');
  },
}));
vi.mock('@codeimage/ui', () => ({
  Loading: () => null,
  Text: (props: {children: unknown}) => props.children,
}));
vi.mock('./TabIcon/TabIcon', () => ({TabIcon: () => null}));
vi.mock('../../Icons/CloseIcon', () => ({CloseIcon: () => null}));
vi.mock('../../Icons/PlusIcon', () => ({PlusIcon: () => null}));
vi.mock('../../Frame/FrameSkeleton', () => ({FrameSkeleton: () => null}));
vi.mock('./TabAddButton/TabAddButton.css', () => ({button: 'add'}));
vi.mock('./Tab/Tab.css', () => ({
  wrapper: () => 'tabs',
  tabListWrapper: 'list',
  tab: () => 'tab',
  tabTextContent: 'text',
  tabCloseIcon: 'close',
  fallbackText: 'fallback',
  tabVars: {tabIndex: '--tab-index'},
}));
vi.mock('./Tab/WindowTabStyle.css', () => ({
  wrapper: 'tabs',
  list: 'list',
  tab: 'tab',
  text: 'text',
  mark: 'mark',
  add: 'add',
  close: 'close',
}));

test('classic tabs of an export render without a translation context and without prop attributes', () => {
  const html = renderToString(() =>
    createComponent(TerminalWindowTabList, {accent: true, readOnly: true}),
  );
  expect(html).toContain('first.ts');
  expect(html).toContain('second.ts');
  expect(html).not.toMatch(/\s(active|index|accentmode|appearance|tabicon)=/i);
});
