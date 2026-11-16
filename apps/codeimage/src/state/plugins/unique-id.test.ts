import {afterEach, describe, expect, it, vi} from 'vitest';
import {createEditorId, createRandomId, versionateId} from './unique-id';

afterEach(() => vi.unstubAllGlobals());

describe('persistent IDs', () => {
  it.each([true, false])(
    'creates distinct versioned tab IDs with secure context %s',
    secure => {
      if (!secure)
        vi.stubGlobal('crypto', {
          getRandomValues: crypto.getRandomValues.bind(crypto),
        });
      const saved = createEditorId();
      const imported = createEditorId();
      expect(imported).not.toBe(saved);
      expect(saved).toMatch(/^[\da-f-]+\$0$/);
      expect(versionateId(saved)).toBe(saved.replace('$0', '$1'));
      const ids = Array.from({length: 1000}, createRandomId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        ids.every(id =>
          /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(
            id,
          ),
        ),
      ).toBe(true);
    },
  );
});
