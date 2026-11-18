import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {Listbox} from '@ui/legacy-listbox';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, Show} from 'solid-js';
import {FontSystemPicker} from '../localized/FontSystemPicker';
import {createFontPickerListboxProps} from '../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';
import {createListedModel} from '../command-menu/listed-model';
import type {EditorControlsModel} from '../model';
import type {ChoiceControl} from './fields';

export function ChoiceList(props: {control: ChoiceControl}) {
  const choose = (values: Set<string>) => {
    const key = values.keys().next().value;
    if (key !== undefined) props.control.set(key);
  };
  return (
    <Listbox
      aria-label={props.control.label()}
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      options={props.control
        .options()
        .map(option => ({label: option.label, value: option.key}))}
      optionValue={item => item.value}
      optionTextValue={item => item.label}
      itemLabel={item => item.label}
      value={[props.control.value()]}
      onChange={choose}
    />
  );
}

/** The production font picker's contents, without nesting its popover in a dialog. */
export function FontEditor(props: {
  model: EditorControlsModel;
  close: () => void;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  const editor = getRootEditorStore();
  const family = createListedModel(props.model).choice('font.family');
  const [source, setSource] = createSignal<'default' | 'system'>(
    editor.computed.selectedFont()?.type === 'system' ? 'system' : 'default',
  );
  if (!family) return null;
  const fonts = createFontPickerListboxProps({
    onEsc: props.close,
    onChange: family.set,
    get value() {
      return family.value();
    },
    get items() {
      return family
        .options()
        .map(option => ({label: option.label, value: option.key}));
    },
  });
  return (
    <>
      <SegmentedField
        size="sm"
        value={source()}
        onChange={setSource}
        items={[
          {label: t('editor.default'), value: 'default'},
          {label: t('editor.system'), value: 'system'},
        ]}
      />
      <Show
        when={source() === 'default'}
        fallback={
          <FontSystemPicker
            value={family.value()}
            onChange={family.set}
            onEsc={props.close}
          />
        }
      >
        <Listbox {...fonts} />
      </Show>
    </>
  );
}
