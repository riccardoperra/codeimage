import type {SnapshotInput} from '../../../packages/render/dist/index.mjs';
import {standardCases} from './standard-cases';
import {geometryCases} from './geometry-cases';
import {textCases} from './text-cases';
export function createPair(scale: number) {
  const BASE: SnapshotInput = {
    $version: '1.10.0',
    $snippetId: null,
    format: 'png',
    scale,
    frame: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      padding: 64,
      radius: 8,
      visible: true,
      opacity: 100,
    },
    terminal: {
      type: 'macOs',
      showHeader: true,
      accentVisible: true,
      shadow: '0 20px 40px rgba(0,0,0,.3)',
      background: '#282a36',
      textColor: '#f8f8f2',
      showWatermark: true,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: 'glass',
    },
    editor: {
      options: {
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        showLineNumbers: false,
        themeId: 'dracula',
        enableLigatures: true,
      },
      editors: [],
    },
  };

  type Tab = {code: string; marks?: unknown; lineNumberStart?: number};
  type Overrides = {
    options?: Partial<SnapshotInput['editor']['options']>;
    terminal?: Record<string, unknown>;
    frame?: Record<string, unknown>;
    width?: number;
    languageId?: string;
    tabNames?: [string, string];
  };

  function pair(from: Tab, to: Tab, overrides: Overrides = {}): SnapshotInput {
    const tab = (
      id: string,
      tabName: string,
      {code, marks, lineNumberStart}: Tab,
    ) => ({
      id,
      code,
      tabName,
      languageId: overrides.languageId ?? 'typescript',
      lineNumberStart: lineNumberStart ?? 1,
      ...(marks ? {marks} : {}),
    });
    return {
      ...BASE,
      ...(overrides.width ? {width: overrides.width} : {}),
      frame: {...BASE.frame, ...overrides.frame},
      terminal: {...BASE.terminal, ...overrides.terminal},
      editor: {
        options: {...BASE.editor.options, ...overrides.options},
        editors: [
          tab('a', overrides.tabNames?.[0] ?? 'before.ts', from),
          tab('b', overrides.tabNames?.[1] ?? 'after.ts', to),
        ],
      },
    } as SnapshotInput;
  }
  return pair;
}
export type Pair = ReturnType<typeof createPair>;
export function createCases(scale: number) {
  const pair = createPair(scale);
  return [...standardCases(pair), ...geometryCases(pair), ...textCases(pair)];
}
