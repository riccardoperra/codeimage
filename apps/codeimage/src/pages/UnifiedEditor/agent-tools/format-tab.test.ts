import {describe, expect, it, vi} from 'vitest';
import {formatTab} from './format-tab';

function fakeEditors(ids: string[], active: string) {
  const state = {ids: [...ids], active};
  const formatted = vi.fn((_id: string) => {});
  const deps = {
    editors: () => state.ids.map(id => ({id})),
    isActive: (id: string) => state.active === id,
    select: vi.fn((id: string) => (state.active = id)),
    format: vi.fn(async () => {
      formatted(state.active);
      return true;
    }),
  };
  return {state, deps, formatted};
}

describe('formatTab', () => {
  it('formats the tab a call wrote, found by id after other tabs closed', async () => {
    const fake = fakeEditors(['a', 'b', 'c'], 'a');
    fake.state.ids.splice(0, 1);
    expect(await formatTab(fake.deps, 'c')).toBe(true);
    expect(fake.deps.select).toHaveBeenCalledWith('c');
    expect(fake.formatted).toHaveBeenCalledWith('c');
  });

  it('formats the active tab without switching', async () => {
    const fake = fakeEditors(['a', 'b'], 'b');
    expect(await formatTab(fake.deps, 'b')).toBe(true);
    expect(fake.deps.select).not.toHaveBeenCalled();
  });

  it('does nothing for a closed tab', async () => {
    const fake = fakeEditors(['a'], 'a');
    expect(await formatTab(fake.deps, 'gone')).toBe(false);
    expect(fake.deps.format).not.toHaveBeenCalled();
  });

  it('reports a code that did not format', async () => {
    const fake = fakeEditors(['a'], 'a');
    fake.deps.format.mockResolvedValueOnce(false);
    expect(await formatTab(fake.deps, 'a')).toBe(false);
  });
});
