import assert from 'node:assert/strict';
import type {EditorState} from '@codeimage/store/editor/model';
import {createComponent, type ParentProps} from 'solid-js';
import {renderToString} from 'solid-js/web';
import type * as SolidWeb from 'solid-js/web';
import {test, vi} from 'vitest';
import {PreviewFrame} from './PreviewFrame';

const frame = vi.hoisted(() => ({width: 775, height: 289}));
vi.mock('@codeimage/store/editor/frame', () => ({
  getFrameState: () => ({store: frame}),
}));
vi.mock('@codeimage/store/assets/assets', () => ({
  getAssetsStore: () => ({isAssetUrl: () => false}),
  isAssetUrl: () => false,
}));
vi.mock('@codeimage/store/assets/AssetsImage', () => ({
  AssetsImage: () => null,
}));
vi.mock('@codeimage/store/canvas', () => ({
  getExportCanvasStore: () => ({get: {}}),
}));
vi.mock('@codeimage/store/editor', () => ({
  getRootEditorStore: () => ({state: {options: {}}}),
}));
vi.mock('@codeimage/store/editor/activeEditor', () => ({
  getActiveEditorStore: () => ({editor: () => undefined}),
}));
vi.mock('@codeimage/store/editor/config.store', () => ({
  EditorConfigStore: {},
}));
vi.mock('@codeimage/store/editor/terminal', () => ({
  getTerminalState: () => ({state: {}}),
}));
vi.mock('@codeimage/store/theme/theme.store', () => ({
  getThemeStore: () => ({themeArray: () => [() => ({})]}),
}));
vi.mock('@codeimage/store/effects/onCopyToClipboard', () => ({
  dispatchCopyToClipboard: vi.fn(),
}));
vi.mock('statebuilder', () => ({provideState: () => ({get: {}})}));
vi.mock('solid-js/web', async importOriginal => ({
  ...(await importOriginal<typeof SolidWeb>()),
  Portal: (props: ParentProps) => props.children,
}));
vi.mock('../Terminal/DynamicTerminal/DynamicTerminal', () => ({
  DynamicTerminal: () => null,
}));
vi.mock('./FrameSkeleton', () => ({FrameSkeleton: () => null}));
vi.mock('./Frame.css', () => ({
  previewPortal: 'portal',
  previewWrapper: 'preview',
  container: 'frame',
  previewOverlay: 'overlay',
  frameVars: {
    radius: '--radius',
    width: '--width',
    height: '--height',
    padding: '--padding',
    backgroundColor: '--background',
    opacity: '--opacity',
    visibility: '--visibility',
  },
}));

const tab: EditorState = {
  id: 'second-tab',
  code: 'const second = 2;',
  tab: {tabName: 'second.ts'},
  languageId: 'typescript',
  lineNumberStart: 1,
  marks: {lines: [], focusedLines: []},
};

for (const [width, height] of [
  [775, 289],
  [975, 420],
  [0, 0],
]) {
  test(`uses the same ${width} × ${height} frame for active and explicit tabs`, () => {
    Object.assign(frame, {width, height});
    for (const selectedTab of [undefined, tab]) {
      const html = renderToString(() =>
        createComponent(PreviewFrame, {
          ref: () => undefined,
          tab: selectedTab,
          language: null,
        }),
      );
      assert.ok(
        html.includes(`--width:${width ? `${width}px` : 'auto'}`),
        html,
      );
      assert.ok(
        html.includes(`--height:${height ? `${height}px` : 'auto'}`),
        html,
      );
    }
  });
}
