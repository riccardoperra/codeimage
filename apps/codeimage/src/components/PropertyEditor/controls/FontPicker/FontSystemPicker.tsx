import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {Box, FieldLabelHint, Link, LoadingCircle, Text} from '@codeimage/ui';
import {Button, VirtualizedListbox} from '@codeui/kit';
import {
  createMemo,
  Match,
  onCleanup,
  onMount,
  Show,
  Suspense,
  Switch,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {provideState} from 'statebuilder';
import {HintIcon} from '../../../Icons/Hint';
import * as styles from './FontPicker.css';
import {createFontPickerListboxProps} from './FontPickerListbox';

interface FontSystemPickerProps {
  onEsc: () => void;
  onChange: (value: string) => void;
  value: string;
}

export function FontSystemPicker(props: FontSystemPickerProps) {
  const configStore = provideState(EditorConfigStore);
  const {localFontsApi} = configStore;

  onMount(() => {
    const subscription = localFontsApi.accessSystemFonts().subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  const fonts = createMemo(() => {
    return Object.entries(unwrap(localFontsApi.state().fonts)).map(
      ([fontId, fontDataList]) => ({
        label: fontDataList[0].postscriptName,
        value: fontId,
      }),
    );
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

  return (
    <Suspense>
      <Switch>
        <Match when={localFontsApi.state().permissionState === 'granted'}>
          <Button
            size={'xs'}
            theme={'secondary'}
            onClick={localFontsApi.loadFonts}
          >
            Reload fonts
          </Button>

          <Show
            fallback={<LoadingContent />}
            when={!localFontsApi.state().loading}
          >
            <div class={styles.virtualizedFontListboxWrapper}>
              <VirtualizedListbox
                class={styles.virtualizedFontListbox}
                theme={'primary'}
                bordered
                {...listboxProps}
              />
            </div>
          </Show>
        </Match>
        <Match when={localFontsApi.state().permissionState === 'prompt'}>
          <LoadingContent message={'Waiting for permission.'} />
        </Match>
        <Match when={localFontsApi.state().permissionState === 'unsupported'}>
          <UnsupportedContent />
        </Match>
        <Match when={localFontsApi.state().permissionState === 'denied'}>
          <DeniedContent />
        </Match>
      </Switch>
    </Suspense>
  );
}

const LocalFontAccessApiLink = () => (
  <Link
    size={'sm'}
    underline
    weight={'medium'}
    target={'_blank'}
    href={
      'https://developer.mozilla.org/en-US/docs/Web/API/Local_Font_Access_API'
    }
    style={{display: 'block'}}
  >
    Local Font Access API
  </Link>
);

export function UnsupportedContent() {
  return (
    <div class={styles.centeredContent}>
      <Text size={'sm'}>
        Your browser does not support <LocalFontAccessApiLink />
      </Text>
    </div>
  );
}

export function LoadingContent(props: {message?: string}) {
  return (
    <div class={styles.centeredContent}>
      <LoadingCircle size={'md'} />
      <Show when={props.message}>{props.message}</Show>
    </div>
  );
}

export function DeniedContent() {
  return (
    <div class={styles.centeredContent}>
      <p>
        <Text size={'sm'} style={{display: 'block'}}>
          You denied the access to the <LocalFontAccessApiLink />
        </Text>
      </p>
      <Box marginTop={6}>
        <FieldLabelHint icon={() => <HintIcon size={'sm'} />}>
          <Link
            size={'sm'}
            underline
            target={'_blank'}
            href={
              'https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform%3DDesktop'
            }
            style={{display: 'block'}}
          >
            Change site permission settings
          </Link>
        </FieldLabelHint>
      </Box>
    </div>
  );
}
