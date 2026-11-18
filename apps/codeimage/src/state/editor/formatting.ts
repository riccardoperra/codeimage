import type {Options} from 'prettier';
import {createSignal} from 'solid-js';

type FormattingOptions = Required<
  Pick<
    Options,
    | 'printWidth'
    | 'tabWidth'
    | 'useTabs'
    | 'singleQuote'
    | 'semi'
    | 'trailingComma'
    | 'bracketSpacing'
    | 'singleAttributePerLine'
  >
>;

export const FORMAT_LIMITS = {
  printWidth: {min: 20, max: 200},
  tabWidth: {min: 1, max: 8},
};

export const defaultFormattingOptions: FormattingOptions = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  singleQuote: false,
  semi: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  singleAttributePerLine: false,
};

const storageKey = 'codeimage:formatting';

function validNumber(value: unknown, limits: {min: number; max: number}) {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= limits.min &&
    value <= limits.max
    ? value
    : undefined;
}

function parseOptions(raw: unknown): FormattingOptions {
  if (typeof raw !== 'object' || raw === null) return defaultFormattingOptions;
  const entries: Record<string, unknown> = {...raw};
  const {printWidth, tabWidth, trailingComma} = entries;
  const boolean = (key: keyof FormattingOptions) =>
    typeof entries[key] === 'boolean' ? entries[key] : undefined;
  return {
    printWidth:
      validNumber(printWidth, FORMAT_LIMITS.printWidth) ??
      defaultFormattingOptions.printWidth,
    tabWidth:
      validNumber(tabWidth, FORMAT_LIMITS.tabWidth) ??
      defaultFormattingOptions.tabWidth,
    useTabs: boolean('useTabs') ?? defaultFormattingOptions.useTabs,
    singleQuote: boolean('singleQuote') ?? defaultFormattingOptions.singleQuote,
    semi: boolean('semi') ?? defaultFormattingOptions.semi,
    bracketSpacing:
      boolean('bracketSpacing') ?? defaultFormattingOptions.bracketSpacing,
    singleAttributePerLine:
      boolean('singleAttributePerLine') ??
      defaultFormattingOptions.singleAttributePerLine,
    trailingComma:
      trailingComma === 'none' ||
      trailingComma === 'es5' ||
      trailingComma === 'all'
        ? trailingComma
        : defaultFormattingOptions.trailingComma,
  };
}

function readOptions(): FormattingOptions {
  try {
    return parseOptions(JSON.parse(localStorage.getItem(storageKey) ?? 'null'));
  } catch {
    return defaultFormattingOptions;
  }
}

const [options, setOptions] = createSignal(readOptions());

function save(value: FormattingOptions) {
  setOptions(value);
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    return;
  }
}

export const formatting = {
  options,
  set<Key extends keyof FormattingOptions>(
    key: Key,
    value: FormattingOptions[Key],
  ) {
    save(parseOptions({...options(), [key]: value}));
  },
  reset: () => save(defaultFormattingOptions),
};
