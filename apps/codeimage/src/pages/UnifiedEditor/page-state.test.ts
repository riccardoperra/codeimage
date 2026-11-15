import {describe, expect, it} from 'vitest';
import {resolveEditorPageState} from './page-state';

describe('editor page state', () => {
  it('makes the local document editable regardless of the previous snippet', () => {
    expect(resolveEditorPageState(undefined, 'ready', true)).toEqual({
      kind: 'local',
      editable: true,
      ready: true,
    });
  });

  it.each(['pending', 'refreshing'] as const)(
    'withholds editing while a snippet is %s',
    state => {
      expect(resolveEditorPageState('snippet', state, false)).toEqual({
        kind: 'loading',
        editable: false,
        ready: false,
        snippetId: 'snippet',
      });
    },
  );

  it('allows the owner to edit a loaded snippet', () => {
    expect(resolveEditorPageState('snippet', 'ready', false)).toEqual({
      kind: 'owner',
      editable: true,
      ready: true,
      snippetId: 'snippet',
    });
  });

  it('offers a read-only view to another user', () => {
    expect(resolveEditorPageState('snippet', 'ready', true)).toEqual({
      kind: 'read-only',
      editable: false,
      ready: true,
      snippetId: 'snippet',
    });
  });

  it.each(['unresolved', 'errored'] as const)(
    'withholds editing when the snippet is %s',
    state => {
      expect(resolveEditorPageState('snippet', state, false)).toEqual({
        kind: 'unavailable',
        editable: false,
        ready: false,
        snippetId: 'snippet',
      });
    },
  );
});
