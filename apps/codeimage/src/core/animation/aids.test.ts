import {expect, test, vi} from 'vitest';
import {Window} from 'happy-dom';
import {stripAnimateAids} from './aids';

test('export and measurement cleanup removes badges and dimming without removing code rows', () => {
  vi.stubGlobal('document', new Window().document);
  const host = document.createElement('div');
  host.innerHTML =
    '<div class="cm-line ghost focus" data-animate-aid="line" data-animate-aid-classes="ghost focus">code<span data-animate-aid="badge">2→</span></div>';
  stripAnimateAids(host);
  expect(host.textContent).toBe('code');
  expect(host.querySelector('.cm-line')?.className).toBe('cm-line');
  expect(host.querySelector('[data-animate-aid]')).toBeNull();
  vi.unstubAllGlobals();
});
