import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as themes from '../src/lib/themes';
import {readKeywordColor} from '../scripts/generate-accents.cts';

for (const theme of Object.values(themes)) {
  test(`${theme.id} exposes its parseable keyword colour as the terminal accent`, () => {
    const accent = theme.properties.terminal.accent;
    assert.match(
      accent ?? '',
      /^(?:#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?|rgba?\([\d.,\s]+\))$/i,
    );
    assert.equal(accent, readKeywordColor(theme));
  });
}
