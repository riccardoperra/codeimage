import {
  EditorSyncProvider,
  getEditorSyncAdapter,
} from '@codeimage/store/editor/createEditorInit';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {useParams} from '@solidjs/router';
import {createEffect, lazy, on, onMount} from 'solid-js';

const App = lazy(() => import('./App'));

export default function Editor() {
  return (
    <EditorSyncProvider>
      {(() => {
        const params = useParams();
        // prettier-ignore
        const {
          setSnippetId,
          initRemoteDbSync
        } = getEditorSyncAdapter()!;

        onMount(() => {
          getThemeStore().loadThemes();
          initRemoteDbSync();
        });

        createEffect(
          on(
            () => params.snippetId,
            snippetId => setSnippetId(snippetId ?? null),
          ),
        );

        return <App />;
      })()}
    </EditorSyncProvider>
  );
}
