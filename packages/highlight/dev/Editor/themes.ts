import {CustomTheme} from '../../src/lib/core';
import * as themes from '../../src/lib/themes';

export const AVAILABLE_THEMES: CustomTheme[] = Object.values(themes).sort(
  (a, b) => a.properties.label.localeCompare(b.properties.label),
);
