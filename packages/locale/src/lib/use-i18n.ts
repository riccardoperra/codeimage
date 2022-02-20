import {useContext} from 'solid-js';
import {LocaleContext} from './context';
import {Path} from './path';

export function useI18n<T>() {
  const i18n = useContext(LocaleContext);

  if (!i18n) {
    throw new Error('LocaleContext has not been provided.');
  }

  const translate = (
    path: Path<T>,
    params?: Record<string, unknown>,
    lang?: string,
  ) => i18n.t(path, params, lang);

  return {
    t: translate,
  };
}
