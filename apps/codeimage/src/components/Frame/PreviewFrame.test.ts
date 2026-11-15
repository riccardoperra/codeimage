import assert from 'node:assert/strict';
import type {EditorState} from '@codeimage/store/editor/model';
import {createComponent, type ParentProps} from 'solid-js';
import {renderToString} from 'solid-js/web';
import type * as SolidWeb from 'solid-js/web';
import {test, vi} from 'vitest';
import {PreviewFrame} from './PreviewFrame';

const frame = vi.hoisted(() => ({width: 775, height: 289}));
const exportState = vi.hoisted(() => {
  const state: {resolution: [number, number] | null} = {resolution: null};
  return state;
});
vi.mock('@codeimage/store/editor/frame', () => ({
  getFrameState: () => ({
    store: frame,
    exportTarget: () =>
      exportState.resolution ? {resolution: exportState.resolution} : undefined,
  }),
}));
vi.mock('@codeimage/store/assets/assets', () => ({
  getAssetsStore: () => ({}),
}));
vi.mock('@codeimage/store/canvas', () => ({
  getExportCanvasStore: () => ({get: {}}),
}));
vi.mock('@codeimage/store/editor', () => ({
  getRootEditorStore: () => ({
    state: {options: {}},
    computed: {selectedFont: () => ({name: 'Mono'})},
  }),
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
// Each entry stands for a theme resource; undefined while it loads.
const loaded = vi.hoisted(() => () => ({id: 'stub', editorTheme: []}));
const themes = vi.hoisted(() => ({list: [loaded] as (() => unknown)[]}));
vi.mock('@codeimage/store/theme/theme.store', () => ({
  getThemeStore: () => ({themeArray: () => themes.list}),
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
  DynamicTerminal: (props: ParentProps) => props.children,
}));
vi.mock('./FrameSkeleton', () => ({FrameSkeleton: () => null}));
vi.mock('./FrameSignature.css', () => ({}));
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
    minWidth: '--min-width',
    minHeight: '--min-height',
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

for (const [width, height, resolution] of [
  [775, 289, null],
  [975, 420, null],
  [0, 0, null],
  [775, 289, [1200, 630]],
  [0, 0, [1080, 1080]],
] satisfies [number, number, [number, number] | null][]) {
  test(`uses ${resolution?.join(' × ') ?? `${width} × ${height}`} for active and explicit tabs`, () => {
    exportState.resolution = resolution;
    const expectedWidth = resolution?.[0] ?? width;
    const expectedHeight = resolution?.[1] ?? height;
    Object.assign(frame, {
      width,
      height,
      exportTarget:
        resolution?.[0] === 1200 ? 'open-graph' : resolution ? 'square' : null,
    });
    for (const selectedTab of [undefined, tab]) {
      const html = renderToString(() =>
        createComponent(PreviewFrame, {
          ref: () => undefined,
          tab: selectedTab,
          language: null,
        }),
      );
      assert.ok(
        html.includes(
          `--width:${expectedWidth ? `${expectedWidth}px` : 'max-content'}`,
        ),
        html,
      );
      assert.ok(
        html.includes(
          `--height:${expectedHeight ? `${expectedHeight}px` : 'auto'}`,
        ),
        html,
      );
    }
  });
}

// The new editor mounts the export copy while the theme resources still load.
test('waits for a loaded theme before drawing the code', () => {
  const draw = () =>
    renderToString(() =>
      createComponent(PreviewFrame, {
        ref: () => undefined,
        tab,
        language: null,
      }),
    );
  themes.list = [() => undefined, () => undefined];
  try {
    assert.ok(!draw().includes('data-static-code-view'));
  } finally {
    themes.list = [loaded];
  }
  assert.ok(draw().includes('data-static-code-view'));
});
