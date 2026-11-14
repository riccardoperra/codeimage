import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type {JSX} from 'solid-js';
import {Show, Suspense} from 'solid-js';
import {provideState} from 'statebuilder';
import {EditorPageSkeleton} from '../../pages/Editor/components/EditorSkeleton';

/** Loads the editor stores as the production editor route does, then shows the page. */
export function EditorHost(props: {children: JSX.Element}): JSX.Element {
  getThemeStore().loadThemes();
  const editorConfig = provideState(EditorConfigStore);

  return (
    <Suspense fallback={<EditorPageSkeleton />}>
      <Show when={editorConfig.get.ready} fallback={<EditorPageSkeleton />}>
        {/* Same as the production route, which passes an undefined snippet id
            despite the string type: this editor edits the local document. */}
        <EditorSyncProvider snippetId={undefined!}>
          {props.children}
        </EditorSyncProvider>
      </Show>
    </Suspense>
  );
}
