import {expect, it} from 'vitest';
import {releaseTitle} from './releaseDate';

it.each(['en', 'it', 'de', 'es'])(
  'reads a release title containing a dotted id in %s',
  locale => {
    expect(releaseTitle({id: '2.0'}, locale)).toBe('CodeImage 2.0');
  },
);
