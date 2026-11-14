import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {VersionStore} from '@codeimage/store/version/version.store';
import type {JSX} from 'solid-js';
import {Show, Suspense} from 'solid-js';
import {provideState} from 'statebuilder';

/**
 * Loads the editor stores as the production editor route does, then shows the
 * page. It shows nothing while they load: today's page skeleton draws a frame
 * between two sidebars, away from where any of these layouts puts it.
 */
export function EditorHost(props: {children: JSX.Element}): JSX.Element {
  getThemeStore().loadThemes();
  const editorConfig = provideState(EditorConfigStore);
  const versionState = provideState(VersionStore);

  return (
    <Suspense>
      <Show when={editorConfig.get.ready && versionState.ready()}>
        {/* Same as the production route, which passes an undefined snippet id
            despite the string type: this editor edits the local document. */}
        <EditorSyncProvider snippetId={undefined!}>
          {props.children}
        </EditorSyncProvider>
      </Show>
    </Suspense>
  );
}
