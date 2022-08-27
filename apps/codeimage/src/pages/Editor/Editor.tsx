import {
  EditorSyncProvider,
  getEditorSyncAdapter,
} from '@codeimage/store/editor/createEditorInit';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {LoadingOverlay} from '@codeimage/ui';
import {useParams} from '@solidjs/router';
import {createEffect, lazy, on, onMount, Show} from 'solid-js';

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
        // prettier-ignore
        const {
          loadedSnippet,
          setSnippetId,
          initRemoteDbSync
        } = getEditorSyncAdapter()!;

        onMount(() => initRemoteDbSync());

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
