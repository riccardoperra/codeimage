import type {Resource} from '@codeimage/store/plugins/create-resource';

export type EditorPageState =
  | {readonly kind: 'local'; readonly editable: true; readonly ready: true}
  | {
      readonly kind: 'loading';
      readonly editable: false;
      readonly ready: false;
      readonly snippetId: string;
    }
  | {
      readonly kind: 'owner';
      readonly editable: true;
      readonly ready: true;
      readonly snippetId: string;
    }
  | {
      readonly kind: 'read-only';
      readonly editable: false;
      readonly ready: true;
      readonly snippetId: string;
    }
  | {
      readonly kind: 'unavailable';
      readonly editable: false;
      readonly ready: false;
      readonly snippetId: string;
    };

export function resolveEditorPageState(
  snippetId: string | undefined,
  state: Resource<unknown>['state'],
  readOnly: boolean,
): EditorPageState {
  if (!snippetId) return {kind: 'local', editable: true, ready: true};
  switch (state) {
    case 'pending':
    case 'refreshing':
      return {kind: 'loading', editable: false, ready: false, snippetId};
    case 'ready':
      return readOnly
        ? {kind: 'read-only', editable: false, ready: true, snippetId}
        : {kind: 'owner', editable: true, ready: true, snippetId};
    case 'unresolved':
    case 'errored':
      return {kind: 'unavailable', editable: false, ready: false, snippetId};
  }
}
