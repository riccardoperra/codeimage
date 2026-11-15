import type {LocaleKeys} from '@codeimage/locale';
import {expectTypeOf, it} from 'vitest';

it('keeps each translation leaf under its own parent', () => {
  expectTypeOf<
    LocaleKeys<{
      en: {export: {start: string}; animation: {errors: {workerLoad: string}}};
    }>
  >().toEqualTypeOf<'export.start' | 'animation.errors.workerLoad'>();
});
