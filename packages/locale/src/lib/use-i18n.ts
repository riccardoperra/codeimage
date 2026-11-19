import type {LocaleKeys} from './path';
import {createContext, createSignal, useContext} from 'solid-js';

type Dictionary = Record<string, unknown>;
type Dictionaries = Record<string, Dictionary>;
interface LocaleControl {
  read: () => string;
  write: (language: string) => void;
}

function isDictionary(value: unknown): value is Dictionary {
  return typeof value === 'object' && value !== null;
}

function readPath(dictionary: unknown, path: string) {
  return path
    .trim()
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        isDictionary(value) && Object.hasOwn(value, key)
          ? value[key]
          : undefined,
      dictionary,
    );
}

function initialLocale(dictionaries: Dictionaries) {
  if (
    typeof navigator !== 'undefined' &&
    Object.hasOwn(dictionaries, navigator.language)
  )
    return navigator.language;
  return Object.keys(dictionaries)[0] ?? '';
}

export function createI18nContext(
  initial: Dictionaries = {},
  source: string | LocaleControl = initialLocale(initial),
) {
  const [readLocale, writeLocale] =
    typeof source === 'string'
      ? createSignal(source)
      : ([source.read, source.write] as const);
  const [dictionaries, setDictionaries] = createSignal(initial);

  function translate(key: string, values?: Dictionary, fallback = ''): string {
    const value = readPath(dictionaries()[readLocale()], key);
    if (typeof value === 'function') {
      const message: unknown = value(values);
      return typeof message === 'string' ? message : fallback;
    }
    const message = typeof value === 'string' ? value : fallback;
    return message.replace(/{{([^{}]+)}}/g, (_, path: string) =>
      String(readPath(values, path) ?? ''),
    );
  }

  function locale(language?: string) {
    if (!language) return readLocale();
    writeLocale(language);
    return language;
  }

  function merge(updates: Dictionary) {
    setDictionaries(previous => {
      const next = {...previous};
      for (const [language, dictionary] of Object.entries(updates)) {
        if (isDictionary(dictionary))
          next[language] = {...next[language], ...dictionary};
      }
      return next;
    });
  }

  return [
    translate,
    {
      tUnsafe: translate,
      merge,
      add: (language: string, dictionary: Dictionary) =>
        merge({[language]: dictionary}),
      dict: (language: string) => dictionaries()[language],
      locale,
    },
  ] as const;
}

type I18nReturnType = ReturnType<typeof createI18nContext>;
export const I18nContext = createContext<I18nReturnType>();

export function useI18n<T>(): readonly [
  (message: LocaleKeys<T>, values?: Dictionary) => string,
  I18nReturnType[1],
] {
  return useContext(I18nContext);
}
