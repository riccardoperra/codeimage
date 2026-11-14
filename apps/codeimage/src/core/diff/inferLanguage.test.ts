import {inferLanguageFromPath} from '@codeimage/config';
import {expect, it} from 'vitest';

it('infers languages through the shared config filename matchers', () => {
  expect(inferLanguageFromPath('src/index.tsx')).toBe('typescript');
  expect(inferLanguageFromPath('main.py')).toBe('python');
  expect(inferLanguageFromPath('site/index.html')).toBe('html');
  expect(inferLanguageFromPath('unknown.ext')).toBeUndefined();
});
