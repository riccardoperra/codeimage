import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {Box, FieldLabelHint, Link, LoadingCircle, Text} from '@codeimage/ui';
import {VirtualizedListbox} from '@ui/legacy-listbox';
import {Button, Checkbox, TextField} from '@ui/legacy-controls';
import {createSignal, Match, onSettled, Show, Loading, Switch} from 'solid-js';
import {snapshot} from 'solid-js';
import {useStore} from 'statebuilder';
import {HintIcon} from '../../../components/Icons/Hint';
import * as styles from '../../../components/PropertyEditor/controls/FontPicker/FontPicker.css';
import {createFontPickerListboxProps} from '../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';

interface FontSystemPickerProps {
  onEsc: () => void;
  onChange: (value: string) => void;
  value: string;
}

export function FontSystemPicker(props: FontSystemPickerProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const configStore = useStore(EditorConfigStore);
  const [fontTerm, setFontTerm] = createSignal('');
  const [showOnlyMonospaced, setShowOnlyMonospaced] = createSignal(true);

  const {localFontsApi} = configStore;

  onSettled(() => localFontsApi.observeSystemFonts());

  const fonts = () => {
    const onlyMonospaced = showOnlyMonospaced();
    const term = fontTerm();
    return snapshot(configStore.get.systemFonts)
      .filter(font => !onlyMonospaced || font.fontData.monospaced)
      .filter(
        font => term.length <= 2 || font.name.toLowerCase().includes(term),
      )
      .sort((a, b) => a.fontData.family.localeCompare(b.fontData.family))
      .map(font => ({label: font.name, value: font.id}));
  };

  const listboxProps = createFontPickerListboxProps({
    onEsc: () => props.onEsc(),
    onChange: value => props.onChange(value),
    get value() {
      return props.value;
    },
    get items() {
      return fonts();
    },
  });

  return (
    <Loading>
      <Switch>
        <Match when={localFontsApi.state().permissionState === 'granted'}>
          <div class={styles.virtualizedFontListboxToolbar}>
            <TextField
              placeholder={t('editor.searchFont')}
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
              {t('editor.reloadFonts')}
            </Button>
          </div>

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
          <Box marginTop={'2'}>
            <Checkbox
              disabled={localFontsApi.state().loading}
              checked={showOnlyMonospaced()}
              onChange={setShowOnlyMonospaced}
              size={'md'}
              label={t('editor.monospaced')}
            />
          </Box>
        </Match>
        <Match when={localFontsApi.state().permissionState === 'prompt'}>
          <LoadingContent message={t('editor.waitingPermission')} />
        </Match>
        <Match when={localFontsApi.state().permissionState === 'unsupported'}>
          <UnsupportedContent />
        </Match>
        <Match when={localFontsApi.state().permissionState === 'denied'}>
          <DeniedContent />
        </Match>
      </Switch>
    </Loading>
  );
}

function LocalFontAccessApiLink() {
  return (
    <Link
      size="sm"
      underline
      weight="medium"
      target="_blank"
      href="https://developer.mozilla.org/en-US/docs/Web/API/Local_Font_Access_API"
      style={{display: 'block'}}
    >
      Local Font Access API
    </Link>
  );
}

export function UnsupportedContent() {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <div class={styles.centeredContent}>
      <Text size={'sm'}>
        {t('editor.fontsUnsupported')}
        <LocalFontAccessApiLink />
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
            {t('editor.checkCompatibility')}
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
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <div class={styles.centeredContent}>
      <p>
        <Text size={'sm'} style={{display: 'block'}}>
          {t('editor.fontAccessDenied')}
          <LocalFontAccessApiLink />
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
            {t('editor.changePermissions')}
          </Link>
        </FieldLabelHint>
      </Box>
    </div>
  );
}
