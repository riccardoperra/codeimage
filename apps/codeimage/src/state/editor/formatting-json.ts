import {del, get, set} from 'idb-keyval';
import type {Options} from 'prettier';
import {createSignal} from 'solid-js';
import {defaultFormattingOptions, formatting} from './formatting';

const storageKey = 'codeimage:formatting-json';
export const maxFormattingJsonSize = 64 * 1024;

const boolean = (value: unknown) => typeof value === 'boolean';
const integer = (min: number, max: number) => (value: unknown) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;
const oneOf =
  (...values: string[]) =>
  (value: unknown) =>
    typeof value === 'string' && values.includes(value);

const validators = new Map<string, (value: unknown) => boolean>(
  Object.entries({
    $schema: (value: unknown) => typeof value === 'string',
    printWidth: integer(1, 1000),
    tabWidth: integer(1, 16),
    useTabs: boolean,
    singleQuote: boolean,
    semi: boolean,
    trailingComma: oneOf('none', 'es5', 'all'),
    bracketSpacing: boolean,
    singleAttributePerLine: boolean,
    arrowParens: oneOf('avoid', 'always'),
    proseWrap: oneOf('always', 'never', 'preserve'),
    endOfLine: oneOf('lf', 'crlf', 'cr', 'auto'),
    jsxSingleQuote: boolean,
    bracketSameLine: boolean,
    quoteProps: oneOf('as-needed', 'consistent', 'preserve'),
    htmlWhitespaceSensitivity: oneOf('css', 'strict', 'ignore'),
    vueIndentScriptAndStyle: boolean,
    embeddedLanguageFormatting: oneOf('auto', 'off'),
  } satisfies Partial<
    Record<keyof Options | '$schema', (value: unknown) => boolean>
  >),
);

type Parsed =
  | {kind: 'valid'; options: Options}
  | {kind: 'syntax' | 'tooLarge'}
  | {kind: 'unknownOption' | 'invalidOption'; name: string};

export function parseFormattingJson(source: string): Parsed {
  if (source.length > maxFormattingJsonSize) return {kind: 'tooLarge'};

  let raw: unknown;
  try {
    raw = JSON.parse(source);
  } catch {
    return {kind: 'syntax'};
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return {kind: 'syntax'};

  const entries = Object.entries(raw);
  for (const [name, value] of entries) {
    const validate = validators.get(name);
    if (!validate) return {kind: 'unknownOption', name};
    if (!validate(value)) return {kind: 'invalidOption', name};
  }

  return {
    kind: 'valid',
    options: Object.fromEntries(entries.filter(([name]) => name !== '$schema')),
  };
}

type FormattingMode = 'controls' | 'json';

type SavedConfig = {mode: FormattingMode; source: string};
const [config, setConfig] = createSignal<SavedConfig>();
const [busy, setBusy] = createSignal(false);
let loading: Promise<void> | undefined;

async function read() {
  try {
    const raw = await get<unknown>(storageKey);
    if (
      typeof raw !== 'object' ||
      raw === null ||
      !('source' in raw) ||
      !('mode' in raw)
    )
      return;
    const {source, mode} = raw;
    if (
      typeof source === 'string' &&
      (mode === 'json' || mode === 'controls') &&
      parseFormattingJson(source).kind === 'valid'
    )
      setConfig({mode, source});
  } catch {
    return;
  }
}

const load = () => (loading ??= read());
const source = () => config()?.source;
const mode = () => config()?.mode ?? 'controls';

async function persist(next: SavedConfig | undefined) {
  if (busy()) return false;
  setBusy(true);
  try {
    await load();
    if (next) await set(storageKey, next);
    else await del(storageKey);
    setConfig(next);
    return true;
  } catch {
    return false;
  } finally {
    setBusy(false);
  }
}

export const formattingJson = {
  load,
  mode,
  source,
  busy,
  async setMode(value: FormattingMode) {
    await load();
    if (value === mode()) return true;
    return persist({
      mode: value,
      source: source() ?? JSON.stringify(formatting.options(), null, 2),
    });
  },
  save: (draft: string) =>
    parseFormattingJson(draft).kind === 'valid'
      ? persist({mode: 'json', source: draft})
      : Promise.resolve(false),
  clear: () => persist(undefined),
  async activeOptions() {
    await load();
    const current = config();
    if (current?.mode === 'json') {
      const parsed = parseFormattingJson(current.source);
      if (parsed.kind === 'valid')
        return {...defaultFormattingOptions, ...parsed.options};
    }
    return formatting.options();
  },
};
