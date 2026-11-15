import {createComponent} from 'solid-js';
import {renderToString} from 'solid-js/web';
import {afterEach, expect, it, vi} from 'vitest';
import type {PresetData} from '../../state/presets/types';
import {createSignature} from '../../state/frame/model';
import {CopyCliConfigMenuItem} from './CopyCliConfigMenuItem';
import {toCliConfig} from './cliConfig';

const menu = vi.hoisted(() => ({
  click: async () => {},
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@codeimage/locale', () => ({
  useI18n: () => [(key: string) => key],
}));
vi.mock('@codeimage/ui', () => ({
  toast: {success: menu.success, error: menu.error},
}));
vi.mock('@codeui/kit', () => ({
  DropdownMenuItem: (props: {
    onClick: () => Promise<void>;
    children: string;
  }) => {
    menu.click = props.onClick;
    return props.children;
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const data = {
  appVersion: '1.10.0',
  frame: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 64,
    radius: 8,
    visible: true,
    opacity: 100,
    signature: {...createSignature('@me'), style: 'card'},
  },
  terminal: {
    type: 'editor',
    surface: 'wash',
    showHeader: true,
    accentVisible: true,
    shadow: null,
    background: '#282a36',
    textColor: '#f8f8f2',
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
    borderType: 'glass',
  },
  editor: {
    fontId: 'jetbrains-mono',
    fontWeight: 400,
    showLineNumbers: true,
    themeId: 'dracula',
    enableLigatures: true,
  },
} satisfies PresetData;

it('copies exactly toCliConfig output from the menu action shared by both editors', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', {clipboard: {writeText}});
  const html = renderToString(() =>
    createComponent(CopyCliConfigMenuItem, {data}),
  );
  expect(html).toContain('cliConfig.copy');
  await menu.click();
  expect(writeText).toHaveBeenCalledExactlyOnceWith(toCliConfig(data));
  expect(menu.success).toHaveBeenCalledExactlyOnceWith('cliConfig.copied', {
    position: 'bottom-center',
  });
  expect(menu.error).not.toHaveBeenCalled();
});

it('reports a clipboard failure without success feedback', async () => {
  vi.stubGlobal('navigator', {
    clipboard: {writeText: vi.fn().mockRejectedValue(new Error('Denied'))},
  });
  renderToString(() => createComponent(CopyCliConfigMenuItem, {data}));
  await menu.click();
  expect(menu.error).toHaveBeenCalledExactlyOnceWith('cliConfig.copyError', {
    position: 'bottom-center',
  });
  expect(menu.success).not.toHaveBeenCalled();
});
