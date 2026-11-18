import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {useParams} from '@solidjs/router';
import type {JSX} from '@solidjs/web';
import {Loading, onSettled, Show} from 'solid-js';
import {useStore} from 'statebuilder';

export function EditorHost(props: {children: JSX.Element}): JSX.Element {
  const params = useParams();
  const {loadThemes} = getThemeStore();
  onSettled(() => {
    loadThemes();
  });
  const editorConfig = useStore(EditorConfigStore);

  return (
    <Loading>
      <Show when={editorConfig.get.ready}>
        <EditorSyncProvider snippetId={params.snippetId}>
          {props.children}
        </EditorSyncProvider>
      </Show>
    </Loading>
  );
}
