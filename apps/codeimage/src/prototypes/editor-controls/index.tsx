import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {VersionStore} from '@codeimage/store/version/version.store';
import {createSignal, Show, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {EditorPageSkeleton} from '../../pages/Editor/components/EditorSkeleton';
import {createEditorControlsModel} from './model';
import {Picker} from './picker/Picker';
import {variants} from './registry';
import {createStage} from './stage';

function initialIndex(): number {
  const requested = parseInt(
    new URLSearchParams(location.search).get('v') ?? '',
    10,
  );
  return requested >= 1 && requested <= variants.length ? requested - 1 : 0;
}

function Harness() {
  const model = createEditorControlsModel();
  // A fresh object on every switch or replay, so the keyed Show re-mounts.
  const [mounted, setMounted] = createSignal({index: initialIndex()});

  const select = (index: number) => {
    if (index < 0 || index >= variants.length) return;
    const url = new URL(location.href);
    url.searchParams.set('v', String(index + 1));
    history.replaceState(history.state, '', url);
    setMounted({index});
  };

  return (
    <>
      <Show when={mounted()} keyed>
        {({index}) => {
          // Created outside the JSX: a call in a prop compiles to a getter
          // and would build a new stage on every read.
          const stage = createStage();
          return (
            <Dynamic
              component={variants[index].component}
              model={model}
              stage={stage}
            />
          );
        }}
      </Show>
      <Picker
        names={variants.map(variant => variant.name)}
        active={mounted().index}
        onSelect={select}
        onReplay={() => setMounted(({index}) => ({index}))}
      />
    </>
  );
}

export default function EditorControlsPrototype() {
  getThemeStore().loadThemes();
  const editorConfig = provideState(EditorConfigStore);
  const versionState = provideState(VersionStore);

  return (
    <Suspense fallback={<EditorPageSkeleton />}>
      <Show
        when={editorConfig.get.ready && versionState.ready()}
        fallback={<EditorPageSkeleton />}
      >
        {/* Same as the `/` route, which passes an undefined snippet id
            despite the string type: the prototype edits the local document. */}
        <EditorSyncProvider snippetId={undefined!}>
          <Harness />
        </EditorSyncProvider>
      </Show>
    </Suspense>
  );
}
