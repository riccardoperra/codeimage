import type {Release} from '../../state/whats-new';

// Read the registry date as UTC midnight, including west of UTC.
export const releaseDate = (release: Release, locale: string) =>
  new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'UTC'}).format(
    Date.parse(release.date),
  );
