import type {LocaleKeys} from './path';
import {useI18n as _useI18n} from '@solid-primitives/i18n';
import {batch} from 'solid-js';

type I18nReturnType = ReturnType<typeof _useI18n>;
type EnchantedI18n<T> = readonly [
  tStrict: (
    message: LocaleKeys<T>,
    values?: Parameters<I18nReturnType[0]>[1],
  ) => string,
  i18n: I18nReturnType[1] & {
    tUnsafe: I18nReturnType[0];
    merge: (dict: Record<string, unknown>) => void;
  },
];

export const useI18n = <T>(): EnchantedI18n<T> => {
  const [t, i18n] = _useI18n();

  return [
    t,
    Object.assign(i18n, {
      tUnsafe: t,
      merge: (dict: Record<string, unknown>) =>
        batch(() =>
          Object.entries(dict).forEach(([k, dict]) =>
            i18n.add(k, dict as Record<string, unknown>),
          ),
        ),
    }),
  ];
};
