import {LoadingCircle} from '@codeimage/ui';
import {Button, VirtualizedListbox} from '@codeui/kit';
import {
  createEffect,
  createMemo,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
  untrack,
} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';
import {
  checkLocalFontPermission,
  useLocalFonts,
} from '../../../../hooks/use-local-fonts';
import {createFontPickerListboxProps} from './FontPickerListbox';

interface FontSystemPickerProps {
  onEsc: () => void;
  onChange: (value: string) => void;
  value: string;
}

export function FontSystemPicker(props: FontSystemPickerProps) {
  const [state, setState] = createStore({
    permissionState: null as PermissionState | null,
    fonts: {} as Record<string, FontData[]>,
    loading: false,
    error: null as string | null,
  });

  onMount(() => {
    checkLocalFontPermission()
      .then(permission => {
        permission.onchange = function () {
          setState('permissionState', this.state);
        };
        const {state} = permission;
        setState('permissionState', state);
        setState('loading', true);
        return loadFonts();
      })
      .catch(e => setState('error', e));
  });

  async function loadFonts() {
    untrack(() => {
      if (!state.loading) {
        setState('loading', true);
      }
    });
    await new Promise(r => setTimeout(r, 250));
    return useLocalFonts().then(fonts => {
      setState(state => ({
        ...state,
        fonts: fonts,
        loading: false,
        error: null,
      }));
    });
  }

  const fonts = createMemo(() => {
    console.log('updating font');
    return Object.entries(unwrap(state.fonts)).map(([k, v]) => ({
      label: v[0].family,
      value: k,
    }));
  });

  const listboxProps = createFontPickerListboxProps({
    onEsc: () => props.onEsc(),
    onChange: props.onChange,
    get value() {
      return props.value;
    },
    get items() {
      return fonts();
    },
  });

  createEffect(() => console.log(state.fonts));
  return (
    <Suspense>
      <Switch>
        <Match when={state.permissionState === 'prompt'}>
          <div
            style={{
              width: '100%',
              height: '400px',
              display: 'flex',
              'flex-direction': 'column',
              gap: '1rem',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <LoadingCircle size={'md'} />
            Waiting for permission
          </div>
        </Match>
        <Match when={state.permissionState === 'denied'}>denied</Match>
        <Match when={state.permissionState === 'granted'}>
          <Button size={'xs'} theme={'secondary'} onClick={loadFonts}>
            Reload fonts
          </Button>

          <Show
            fallback={
              <div
                style={{
                  width: '100%',
                  height: '400px',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '1rem',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <LoadingCircle size={'md'} />
              </div>
            }
            when={!state.loading}
          >
            <div
              style={{
                height: '400px',
              }}
            >
              <VirtualizedListbox
                theme={'primary'}
                bordered
                style={{
                  overflow: 'auto',
                  'max-height': '400px',
                }}
                {...listboxProps}
              />
            </div>
          </Show>
        </Match>
      </Switch>
    </Suspense>
  );
}
