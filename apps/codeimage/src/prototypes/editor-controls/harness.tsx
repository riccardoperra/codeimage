import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {VersionStore} from '@codeimage/store/version/version.store';
import type {JSX} from 'solid-js';
import {createSignal, Show, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {EditorPageSkeleton} from '../../pages/Editor/components/EditorSkeleton';
import {createEditorControlsModel} from './model';
import type {Variant} from './contract';
import {Picker} from './picker/Picker';
import {createStage} from './stage';

interface HarnessProps {
  variants: readonly Variant[];
}

function initialIndex(count: number): number {
  const requested = parseInt(
    new URLSearchParams(location.search).get('v') ?? '',
    10,
  );
  return requested >= 1 && requested <= count ? requested - 1 : 0;
}

function Harness(props: HarnessProps) {
  const model = createEditorControlsModel();
  // A fresh object on every switch or replay, so the keyed Show re-mounts.
  const [mounted, setMounted] = createSignal({
    // oxlint-disable-next-line solid/reactivity -- the variant list never changes
    index: initialIndex(props.variants.length),
  });

  const select = (index: number) => {
    if (index < 0 || index >= props.variants.length) return;
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
              component={props.variants[index].component}
              model={model}
              stage={stage}
            />
          );
        }}
      </Show>
      <Picker
        names={props.variants.map(variant => variant.name)}
        active={mounted().index}
        onSelect={select}
        onReplay={() => setMounted(({index}) => ({index}))}
      />
    </>
  );
}

/** Loads the editor stores like the `/` route, then shows one variant at a time behind the picker. */
export function PrototypeRoute(props: HarnessProps): JSX.Element {
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
          <Harness variants={props.variants} />
        </EditorSyncProvider>
      </Show>
    </Suspense>
  );
}
