import {Button, Listbox} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Component} from 'solid-js';
import {createSignal, For, Match, Show, Switch} from 'solid-js';
import {ColorSwatchIcon} from '../../../../components/Icons/ColorSwatch';
import {SparklesIcon} from '../../../../components/Icons/SparklesIcon';
import {ColorPickerPopover} from '../../../../components/PropertyEditor/controls/ColorPicker/ColorPicker';
import {createFontPickerListboxProps} from '../../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';
import {FontSystemPicker} from '../../../../components/PropertyEditor/controls/FontPicker/FontSystemPicker';
import {PanelHeader} from '../../../../components/PropertyEditor/PanelHeader';
import {commandMenu} from '../../command-menu/state';
import {useDock} from './context';
import {AmbientSwatch} from '../../controls/AmbientSwatch';
import {ControlRow} from '../../controls/ControlRow';
import {fieldId, SegmentedChoice} from '../../controls/fields';
import type {GroupId, PanelId} from './fields';
import {GROUPS} from './fields';
import {SearchIcon} from './icons';

/**
 * The theme picker in the style chosen in the harness. In the popover the
 * cards sit in one row that scrolls sideways (see dock.css), so a wheel that
 * only turns up and down has to move it.
 */
function ThemesPanel() {
  const dock = useDock();
  const onWheel = (event: WheelEvent) => {
    const list = (event.currentTarget as HTMLElement).querySelector(
      '[data-theme-list]',
    );
    if (!list || list.scrollWidth <= list.clientWidth) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    list.scrollLeft += event.deltaY;
  };
  return (
    <div class="dock-panel dock-themes" on:wheel={onWheel}>
      <dock.ThemePicker
        size={dock.compact() ? 'md' : 'sm'}
        autofocus
        releaseEscape
        onPick={(_, byKeyboard) => dock.closeAfterPick(byKeyboard)}
      />
    </div>
  );
}

/** Today's colour picker without its popover: gradients, colours and the image upload. */
function BackgroundPanel() {
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
                    {toggle => <ControlRow control={toggle()} prefix="dock" />}
                  </Show>
                </>
              }
            >
              <AmbientSwatch control={control()} />
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

function PaddingPanel() {
  const dock = useDock();
  return (
    <Show when={dock.fields.choice('frame.padding')}>
      {control => (
        <div class="dock-panel dock-padding-panel">
          <PanelHeader label={control().label()} />
          <div class="dock-segmented">
            <SegmentedChoice
              control={control()}
              id={fieldId('dock', control().id)}
            />
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
function LanguagePanel() {
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

/** The content of today's font picker, with the two font rows under it. */
function FontPanel() {
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
        <Show when={weight()}>
          {control => <ControlRow control={control()} prefix="dock" />}
        </Show>
        <Show when={ligatures()}>
          {control => <ControlRow control={control()} prefix="dock" />}
        </Show>
      </div>
    </div>
  );
}

function Group(props: {id: GroupId}) {
  const dock = useDock();
  return (
    <For each={dock.fields.group(props.id)}>
      {control => <ControlRow control={control} prefix="dock" />}
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
        onClick={commandMenu.open}
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

/** Frame, Window and Code, one group at a time, so the panel stays as narrow as a popover. */
function MorePanel() {
  const dock = useDock();
  const [group, setGroup] = createSignal<GroupId>(GROUPS[0].id);
  return (
    <div class="dock-panel dock-more">
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
      <Show when={dock.compact()}>
        <PhoneActions />
      </Show>
    </div>
  );
}

/** What each dock item opens: in a popover on wide windows, in the sheet on a phone. */
export const PANELS: Record<PanelId, {title: string; Body: Component}> = {
  themes: {title: 'Theme', Body: ThemesPanel},
  background: {title: 'Background', Body: BackgroundPanel},
  padding: {title: 'Padding', Body: PaddingPanel},
  language: {title: 'Language', Body: LanguagePanel},
  font: {title: 'Font', Body: FontPanel},
  more: {title: 'More options', Body: MorePanel},
};
