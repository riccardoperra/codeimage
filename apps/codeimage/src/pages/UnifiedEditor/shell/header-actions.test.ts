import {createRoot} from 'solid-js';
import {describe, expect, it} from 'vitest';
import {claimHeaderActions, headerHosts} from './header-actions';

describe('layout ownership of header actions', () => {
  it('returns Studio actions to the header when its rail unmounts', () => {
    expect(headerHosts('commands')).toBe(true);
    expect(headerHosts('settings')).toBe(true);
    expect(headerHosts('experiments')).toBe(true);
    const dispose = createRoot(dispose => {
      claimHeaderActions(['commands', 'settings', 'experiments']);
      return dispose;
    });
    expect(headerHosts('commands')).toBe(false);
    expect(headerHosts('settings')).toBe(false);
    expect(headerHosts('experiments')).toBe(false);
    dispose();
    expect(headerHosts('commands')).toBe(true);
    expect(headerHosts('settings')).toBe(true);
    expect(headerHosts('experiments')).toBe(true);
  });

  it('keeps Experiments in the Dock header and releases claims independently', () => {
    const dock = createRoot(dispose => {
      claimHeaderActions(['commands', 'settings']);
      return dispose;
    });
    expect(headerHosts('commands')).toBe(false);
    expect(headerHosts('settings')).toBe(false);
    expect(headerHosts('experiments')).toBe(true);
    const studio = createRoot(dispose => {
      claimHeaderActions(['commands', 'settings', 'experiments']);
      return dispose;
    });
    studio();
    expect(headerHosts('commands')).toBe(false);
    expect(headerHosts('settings')).toBe(false);
    expect(headerHosts('experiments')).toBe(true);
    dock();
    expect(headerHosts('commands')).toBe(true);
    expect(headerHosts('settings')).toBe(true);
  });
});
