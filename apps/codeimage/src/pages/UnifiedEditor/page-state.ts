import type {Resource} from 'solid-js';

export type EditorPageState =
  | {readonly kind: 'local'; readonly editable: true}
  | {
      readonly kind: 'loading';
      readonly editable: false;
      readonly snippetId: string;
    }
  | {
      readonly kind: 'owner';
      readonly editable: true;
      readonly snippetId: string;
    }
  | {
      readonly kind: 'read-only';
      readonly editable: false;
      readonly snippetId: string;
    }
  | {
      readonly kind: 'unavailable';
      readonly editable: false;
      readonly snippetId: string;
    };

export function resolveEditorPageState(
  snippetId: string | undefined,
  state: Resource<unknown>['state'],
  readOnly: boolean,
): EditorPageState {
  if (!snippetId) return {kind: 'local', editable: true};
  switch (state) {
    case 'pending':
    case 'refreshing':
      return {kind: 'loading', editable: false, snippetId};
    case 'ready':
      return readOnly
        ? {kind: 'read-only', editable: false, snippetId}
        : {kind: 'owner', editable: true, snippetId};
    case 'unresolved':
    case 'errored':
      return {kind: 'unavailable', editable: false, snippetId};
  }
}
