import {whatsNewLocale} from '../../i18n/whatsNew';
import type {Release} from '../../state/whats-new';

// Read the registry date as UTC midnight, including west of UTC.
export const releaseDate = (release: Release, locale: string) =>
  new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'UTC'}).format(
    Date.parse(release.date),
  );

/** Release ids contain dots, which the message resolver treats as path separators. */
export function releaseTitle(
  release: Pick<Release, 'id'>,
  locale: string,
): string {
  const messages =
    Object.entries(whatsNewLocale).find(([id]) => id === locale)?.[1] ??
    whatsNewLocale.en;
  const entry = Object.entries(messages.whatsNew.releases).find(
    ([id]) => id === release.id,
  );
  return entry?.[1].title ?? release.id;
}
