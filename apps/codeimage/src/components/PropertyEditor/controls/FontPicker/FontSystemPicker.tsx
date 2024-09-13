import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {Box, FieldLabelHint, Link, LoadingCircle, Text} from '@codeimage/ui';
import {Button, Checkbox, TextField, VirtualizedListbox} from '@codeui/kit';
import {pipe} from 'rxjs';
import {
  createSignal,
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
  const [fontTerm, setFontTerm] = createSignal('');
  const [showOnlyMonospaced, setShowOnlyMonospaced] = createSignal(true);

  const {localFontsApi} = configStore;

  onMount(() => {
    const subscription = localFontsApi.accessSystemFonts(true).subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  const fonts = () => {
    const onlyMonospaced = showOnlyMonospaced();
    const term = fontTerm();
    const fonts = unwrap(configStore.get.systemFonts);

    return pipe(
      (_: typeof fonts) => _,
      // Monospaced filter
      fonts =>
        onlyMonospaced ? fonts.filter(font => font.fontData.monospaced) : fonts,
      // Term filter
      fonts =>
        term.length > 2
          ? fonts.filter(font => font.name.toLowerCase().includes(term))
          : fonts,
      // Sorting alphabetically
      fonts =>
        fonts.sort((a, b) =>
          a.fontData.family.localeCompare(b.fontData.family),
        ),
      // Map to select items
      fonts =>
        fonts.map(font => ({
          label: font.name,
          value: font.id,
        })),
    )(fonts);
  };

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
          <div class={styles.virtualizedFontListboxToolbar}>
            <TextField
              placeholder={'Search font...'}
              value={fontTerm()}
              onChange={setFontTerm}
              size={'xs'}
              slotClasses={{root: styles.virtualizedFontListboxSearch}}
            />
            <Button
              size={'xs'}
              theme={'secondary'}
              onClick={localFontsApi.loadFonts}
            >
              Reload fonts
            </Button>
          </div>

          <Show
            fallback={<LoadingContent />}
            when={!localFontsApi.state().loading}
          >
            <div class={styles.virtualizedFontListboxWrapper}>
              <VirtualizedListbox
                /* @ts-expect-error Fix @codeui/kit types */
                class={styles.virtualizedFontListbox}
                theme={'primary'}
                bordered
                {...listboxProps}
              />
            </div>
          </Show>
          <Box marginTop={'2'}>
            <Checkbox
              disabled={localFontsApi.state().loading}
              checked={showOnlyMonospaced()}
              onChange={setShowOnlyMonospaced}
              size={'md'}
              label={'Show only monospaced fonts'}
            />
          </Box>
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
      <Box marginTop={6}>
        <FieldLabelHint icon={() => <HintIcon size={'sm'} />}>
          <Link
            size={'sm'}
            underline
            target={'_blank'}
            href={'https://caniuse.com/?search=local%20font'}
            style={{display: 'block'}}
          >
            Check compatibility
          </Link>
        </FieldLabelHint>
      </Box>
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
