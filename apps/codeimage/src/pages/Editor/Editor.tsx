import {
  EditorSyncProvider,
  getEditorSyncAdapter,
} from '@codeimage/store/editor/createEditorInit';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {LoadingOverlay} from '@codeimage/ui';
import {useNavigate, useParams} from 'solid-app-router';
import {createEffect, createResource, lazy, on, onMount, Show} from 'solid-js';

const App = lazy(() => {
  getThemeStore().loadThemes();
  return import('./App').then(component => {
    document.querySelector('#launcher')?.remove();
    return component;
  });
});

export default function Editor() {
  return (
    <EditorSyncProvider>
      {(() => {
        const params = useParams();
        const navigate = useNavigate();
        // prettier-ignore
        const {
          loadedSnippet,
          setSnippetId,
          initRemoteDbSync,
          indexedDbState
        } = getEditorSyncAdapter()!;

        const [idbState] = createResource(indexedDbState);

        onMount(() => initRemoteDbSync());

        createEffect(
          on(idbState, state => {
            if (!params.snippetId && state && state.$snippetId) {
              navigate(`/${state.$snippetId}`);
            }
          }),
        );

        createEffect(
          on(
            () => params.snippetId,
            snippetId => setSnippetId(snippetId ?? null),
          ),
        );

        return (
          <Show
            when={!loadedSnippet.loading}
            fallback={<LoadingOverlay overlay={true} size={'3x'} />}
          >
            <App />;
          </Show>
        );
      })()}
    </EditorSyncProvider>
  );
}
