import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {useParams} from '@solidjs/router';
import type {JSX} from 'solid-js';
import {Show, Suspense} from 'solid-js';
import {provideState} from 'statebuilder';

/**
 * Loads the editor stores as the production editor route does, then shows the
 * page. It shows nothing while they load: today's page skeleton draws a frame
 * between two sidebars, away from where any of these layouts puts it.
 */
export function EditorHost(props: {children: JSX.Element}): JSX.Element {
  const params = useParams();
  getThemeStore().loadThemes();
  const editorConfig = provideState(EditorConfigStore);

  return (
    <Suspense>
      <Show when={editorConfig.get.ready}>
        <EditorSyncProvider snippetId={params.snippetId!}>
          {props.children}
        </EditorSyncProvider>
      </Show>
    </Suspense>
  );
}
