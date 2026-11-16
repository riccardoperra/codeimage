import {SUPPORTED_LANGUAGES} from './languages';

export function inferLanguageFromPath(path: string): string | undefined {
  const name = path.toLowerCase();
  return SUPPORTED_LANGUAGES.find(language =>
    language.icons.some(icon => icon.matcher.test(name)),
  )?.id;
}
