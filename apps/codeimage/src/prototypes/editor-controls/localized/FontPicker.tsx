import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {VersionStore} from '@codeimage/store/version/version.store';
import {FlexField, VStack} from '@codeimage/ui';
import {icons, Listbox} from '@codeui/kit';
import {DynamicSizedContainer} from '@ui/DynamicSizedContainer/DynamicSizedContainer';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, Match, onMount, Switch} from 'solid-js';
import {provideState} from 'statebuilder';
import {SidebarPopover} from '../../../components/PropertyEditor/SidebarPopover/SidebarPopover';
import {SidebarPopoverTitle} from './SidebarPopoverTitle';
import * as styles from '../../../components/PropertyEditor/controls/FontPicker/FontPicker.css';
import {createFontPickerListboxProps} from '../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';
import {FontSystemPicker} from './FontSystemPicker';

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
}

type FontPickerModality = 'default' | 'system';

/**
 * @experimental
 */
export function FontPicker(props: FontPickerProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [open, setOpen] = createSignal(false);
  const [mode, setMode] = createSignal<FontPickerModality>('default');
  const configState = provideState(EditorConfigStore);
  const versionState = provideState(VersionStore);

  onMount(() =>
    versionState.seeOnOpeningEvent({
      featureName: 'fontPicker',
      open,
      log: true,
    }),
  );

  const webListboxItems = () =>
    configState.get.fonts
      .filter(font => font.type === 'web')
      .map(font => ({
        label: font.name,
        value: font.id,
      }));

  const webListboxProps = createFontPickerListboxProps({
    onEsc: () => setOpen(false),
    onChange: props.onChange,
    get value() {
      return props.value;
    },
    get items() {
      return webListboxItems();
    },
  });

  const selectedFont = () =>
    [...configState.get.fonts, ...configState.get.systemFonts].find(
      font => font.id === props.value,
    );

  return (
    <SidebarPopover
      open={open()}
      onOpenChange={setOpen}
      contentClass={styles.fontPickerPopover}
      input={triggerProps => (
        <div class={styles.input} {...triggerProps}>
          <span class={styles.inputValue}>
            {selectedFont()?.name ?? t('editor.noFont')}
          </span>
          <icons.SelectorIcon class={styles.inputIcon} />
        </div>
      )}
    >
      <SidebarPopoverTitle
        experimental
        featureName={'Font System Access API'}
        onClose={() => setOpen(false)}
      >
        {t('frame.font')}
      </SidebarPopoverTitle>

      <DynamicSizedContainer>
        <VStack spacing={2}>
          <FlexField>
            <SegmentedField<FontPickerModality>
              value={mode()}
              autoWidth
              onChange={item => setMode(item)}
              items={[
                {label: t('editor.default'), value: 'default'},
                {label: t('editor.system'), value: 'system'},
              ]}
              size={'sm'}
            />
          </FlexField>

          <Switch>
            <Match when={mode() === 'default'}>
              <Listbox bordered {...webListboxProps} />
            </Match>
            <Match when={mode() === 'system'}>
              <FontSystemPicker
                onEsc={() => setOpen(false)}
                value={props.value}
                onChange={value => props.onChange(value)}
              />
            </Match>
          </Switch>
        </VStack>
      </DynamicSizedContainer>
    </SidebarPopover>
  );
}
