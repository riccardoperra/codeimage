import type {Release} from '../../state/whats-new';

// News copy is English only, so the date matches it. UTC, because the
// registry date is UTC midnight and would read as the day before in the west.
const format = new Intl.DateTimeFormat('en', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

export const releaseDate = (release: Release) =>
  format.format(Date.parse(release.date));
