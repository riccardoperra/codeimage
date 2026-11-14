import {Button, Listbox} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, For, Match, Show, Switch} from 'solid-js';
import {ColorSwatchIcon} from '../../../../components/Icons/ColorSwatch';
import {SparklesIcon} from '../../../../components/Icons/SparklesIcon';
import {ColorPickerPopover} from '../../../../components/PropertyEditor/controls/ColorPicker/ColorPicker';
import {createFontPickerListboxProps} from '../../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';
import {FontSystemPicker} from '../../../../components/PropertyEditor/controls/FontPicker/FontSystemPicker';
import {PanelHeader} from '../../../../components/PropertyEditor/PanelHeader';
import {useDock} from './context';
import {ControlRow, SegmentedChoice} from './controls';
import type {GroupId} from './fields';
import {GROUPS} from './fields';
import {SearchIcon} from './icons';

/** The theme picker in the style chosen in the harness, in the tray. */
export function ThemesPanel() {
  const dock = useDock();
  return (
    <div class="dock-panel dock-themes">
      <dock.ThemePicker
        size={dock.compact() ? 'md' : 'sm'}
        autofocus
        onPick={(_, byKeyboard) => dock.closeAfterPick(byKeyboard)}
      />
    </div>
  );
}

/** Today's colour picker without its popover: gradients, colours and the image upload. */
export function BackgroundPanel() {
  const dock = useDock();
  const frameVisible = () => dock.fields.control('frame.visible', 'toggle');

  return (
    <div class="dock-panel dock-background">
      <Show when={dock.fields.control('frame.background', 'background')}>
        {control => (
          <>
            <PanelHeader label={control().label()} />
            <Show
              when={control().visible()}
              fallback={
                <>
                  <p class="dock-empty">
                    The frame is hidden, so there is no background to set.
                  </p>
                  <Show when={frameVisible()}>
                    {toggle => <ControlRow control={toggle()} />}
                  </Show>
                </>
              }
            >
              <ColorPickerPopover
                value={control().value()}
                onChange={control().set}
                colors={[...control().colors]}
                gradientColors={[...control().gradients]}
              />
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}

export function PaddingPanel() {
  const dock = useDock();
  return (
    <Show when={dock.fields.choice('frame.padding')}>
      {control => (
        <div class="dock-panel dock-padding-panel">
          <PanelHeader label={control().label()} />
          <div class="dock-segmented">
            <SegmentedChoice control={control()} />
          </div>
        </div>
      )}
    </Show>
  );
}

interface Item {
  label: string;
  value: string;
}

/** The phone's language sheet. On wider windows the dock holds the kit's select. */
export function LanguagePanel() {
  const dock = useDock();
  return (
    <Show when={dock.fields.choice('editor.language')}>
      {control => (
        <div class="dock-panel dock-language">
          <PanelHeader label={control().label()} />
          <div class="dock-list">
            <Listbox<Item>
              size={'md'}
              selectionMode={'single'}
              disallowEmptySelection
              autoFocus
              shouldFocusWrap={false}
              options={control()
                .options()
                .map(option => ({label: option.label, value: option.key}))}
              optionValue={item => item.value}
              optionTextValue={item => item.label}
              itemLabel={item => item.label}
              value={[control().value()]}
              onChange={values => {
                const next = values.keys().next().value;
                if (typeof next === 'string') control().set(next);
              }}
            />
          </div>
        </div>
      )}
    </Show>
  );
}

type FontSource = 'default' | 'system';

/** The content of today's font picker without its popover, with the two font rows under it. */
export function FontPanel() {
  const dock = useDock();
  const [source, setSource] = createSignal<FontSource>('default');
  const weight = () => dock.fields.choice('font.weight');
  const ligatures = () => dock.fields.control('font.ligatures', 'toggle');

  return (
    <div class="dock-panel dock-font">
      <Show when={dock.fields.choice('font.family')}>
        {family => {
          const fonts = createFontPickerListboxProps({
            onEsc: dock.close,
            onChange: family().set,
            get value() {
              return family().value();
            },
            get items() {
              return family()
                .options()
                .map(option => ({label: option.label, value: option.key}));
            },
          });
          return (
            <div class="dock-font-family">
              <PanelHeader label={family().label()} />
              <div class="dock-segmented">
                <SegmentedField<FontSource>
                  adapt
                  size={'sm'}
                  value={source()}
                  onChange={setSource}
                  items={[
                    {label: 'Default', value: 'default'},
                    {label: 'System', value: 'system'},
                  ]}
                />
              </div>
              <div class="dock-list">
                <Switch>
                  <Match when={source() === 'default'}>
                    <Listbox {...fonts} />
                  </Match>
                  <Match when={source() === 'system'}>
                    <FontSystemPicker
                      onEsc={dock.close}
                      value={family().value()}
                      onChange={family().set}
                    />
                  </Match>
                </Switch>
              </div>
            </div>
          );
        }}
      </Show>
      <div class="dock-font-style">
        <PanelHeader label="Style" />
        <Show when={weight()}>
          {control => <ControlRow control={control()} />}
        </Show>
        <Show when={ligatures()}>
          {control => <ControlRow control={control()} />}
        </Show>
      </div>
    </div>
  );
}

function Group(props: {id: GroupId}) {
  const dock = useDock();
  return (
    <For each={dock.fields.group(props.id)}>
      {control => <ControlRow control={control} />}
    </For>
  );
}

/**
 * The frame actions for the phone, where the production frame toolbar is not
 * shown. Same buttons as the production phone toolbar, with their labels.
 */
function PhoneActions() {
  const dock = useDock();
  return (
    <div class="dock-phone-actions">
      <Button
        size={'sm'}
        theme={'secondary'}
        leftIcon={<SearchIcon />}
        onClick={() => dock.open('commands')}
      >
        Search all options
      </Button>
      <Button
        size={'sm'}
        theme={'secondary'}
        leftIcon={<ColorSwatchIcon />}
        onClick={() => dock.stage.randomize()}
      >
        Randomize
      </Button>
      <Button
        size={'sm'}
        theme={'secondary'}
        leftIcon={<SparklesIcon />}
        disabled={!dock.stage.canFormat()}
        onClick={() => void dock.stage.format()}
      >
        Format
      </Button>
      <dock.stage.CopyToClipboardButton />
    </div>
  );
}

export function MorePanel() {
  const dock = useDock();
  // The phone sheet shows one group at a time.
  const [group, setGroup] = createSignal<GroupId>(GROUPS[0].id);
  return (
    <div class="dock-panel dock-more">
      <Show
        when={dock.compact()}
        fallback={
          <div class="dock-groups">
            <For each={GROUPS}>
              {group => (
                <section class="dock-group" aria-label={group.label}>
                  <PanelHeader label={group.label} />
                  <Group id={group.id} />
                </section>
              )}
            </For>
          </div>
        }
      >
        <div class="dock-segmented">
          <SegmentedField
            adapt
            size={'sm'}
            value={group()}
            onChange={setGroup}
            items={GROUPS.map(({id, label}) => ({label, value: id}))}
          />
        </div>
        <section class="dock-group" aria-label={group()}>
          <Group id={group()} />
        </section>
        <PhoneActions />
      </Show>
    </div>
  );
}
