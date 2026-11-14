import {expect, test} from 'vitest';
import {createAmbientBackground, createWindowPalette} from './windowPalette';

test('produces literal text alpha steps, opaque accent mixes and an ambient background', () => {
  const palette = createWindowPalette({
    background: '#000000',
    text: '#fff',
    accent: '#ff0000',
  });
  expect(palette.ink04).toBe('rgba(255, 255, 255, 0.04)');
  expect(palette.ink90).toBe('rgba(255, 255, 255, 0.9)');
  expect(palette.status).toBe('rgb(41, 0, 0)');
  expect(createAmbientBackground(palette)).toBe(
    'radial-gradient(70% 90% at 12% 8%, rgba(255, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 62%), radial-gradient(70% 90% at 92% 96%, rgba(255, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 62%), rgb(0, 0, 0)',
  );
});

test.each([
  '#123',
  '#112233',
  'rgb(17, 34, 51)',
  'rgb(17 34 51)',
  'rgb(6.6667% 13.3333% 20%)',
])('parses %s', text => {
  expect(createWindowPalette({background: '#fff', text}).ink62).toBe(
    'rgba(17, 34, 51, 0.62)',
  );
});

test.each([
  '#11223380',
  'rgba(17, 34, 51, 0.50196)',
  'rgb(17 34 51 / 50.196%)',
])('preserves the source alpha of %s', text => {
  expect(createWindowPalette({background: '#fff', text}).ink20).toBe(
    'rgba(17, 34, 51, 0.1004)',
  );
});

test('falls back to text for a missing accent and leaves unsupported colours unchanged', () => {
  expect(createWindowPalette({background: '#fff', text: '#123'}).accent).toBe(
    'rgba(17, 34, 51, 1)',
  );
  const palette = createWindowPalette({
    background: 'var(--paper)',
    text: 'var(--ink)',
    accent: 'hsl(0, 0%, 0%)',
  });
  expect(palette.ink08).toBe('var(--ink)');
  expect(palette.accent).toBe('var(--ink)');
  expect(palette.status).toBe('var(--ink)');
});

test('darkens the ambient base and composites translucent accents into opaque backgrounds', () => {
  const palette = createWindowPalette({
    background: '#ffffff',
    text: '#000',
    accent: 'rgba(255, 0, 0, .5)',
  });
  expect(palette.ambientBase).toBe('rgb(209, 209, 209)');
  expect(palette.status).toBe('rgb(255, 235, 235)');
});
