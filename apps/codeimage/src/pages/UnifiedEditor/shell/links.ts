import type {LocaleKeys} from '@codeimage/locale';
import {getUmami} from '@core/constants/umami';
import type {AppLocaleEntries} from '../../../i18n';

export const editorLinks = [
  {
    id: 'github',
    label: 'editor.github',
    href: 'https://github.com/riccardoperra/codeimage',
  },
  {
    id: 'feedback',
    label: 'editor.feedback',
    href: 'https://github.com/riccardoperra/codeimage/issues',
  },
  {
    id: 'releases',
    label: 'editor.releases',
    href: 'https://github.com/riccardoperra/codeimage/releases',
  },
  {
    id: 'better-comments',
    label: 'editor.betterComments',
    href: 'https://github.com/riccardoperra/better-comments-for-github',
  },
] as const satisfies {
  id: string;
  label: LocaleKeys<AppLocaleEntries>;
  href: string;
}[];

export function trackEditorLink(id: string): void {
  if (id === 'better-comments') getUmami().track('better-comments-for-github');
}
