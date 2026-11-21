import {useI18n} from '@codeimage/locale';
import type {LocaleKeys} from '@codeimage/locale';
import {Button, Listbox} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createSignal, For, Match, Show, Switch} from 'solid-js';
import type {Component} from 'solid-js';
import {SparklesIcon} from '../../../../components/Icons/SparklesIcon';
import {createFontPickerListboxProps} from '../../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';
import {PanelHeader} from '../../../../components/PropertyEditor/PanelHeader';
import type {AppLocaleEntries} from '../../../../i18n';
import {CommandMenuButton} from '../../command-menu/CommandMenuButton';
import {AmbientSwatch} from '../../controls/AmbientSwatch';
import {ControlRow} from '../../controls/ControlRow';
import {fieldId, SegmentedChoice} from '../../controls/fields';
import {ColorPickerPopover} from '../../localized/ColorPicker';
import {FontSystemPicker} from '../../localized/FontSystemPicker';
import {useDock} from './context';
import * as styles from './dock.css';
import {GROUPS} from './fields';
import type {GroupId, PanelId} from './fields';
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
    <div class={`${styles.panel} ${styles.themes}`} onWheel={onWheel}>
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
  const [t] = useI18n<AppLocaleEntries>();
  const dock = useDock();
  const frameVisible = () => dock.fields.control('frame.visible', 'toggle');

  return (
    <div class={styles.panel}>
      <Show when={dock.fields.control('frame.background', 'background')}>
        {control => (
          <>
            <PanelHeader label={control().label()} />
            <Show
              when={control().visible()}
              fallback={
                <>
                  <p class={styles.empty}>{t('editor.hiddenFrame')}</p>
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
        <div class={styles.panel}>
          <PanelHeader label={control().label()} />
          <div class={styles.segmented}>
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
        <div class={styles.panel}>
          <PanelHeader label={control().label()} />
          <div class={styles.list}>
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
  const [t] = useI18n<AppLocaleEntries>();
  const dock = useDock();
  const [source, setSource] = createSignal<FontSource>('default');
  const weight = () => dock.fields.choice('font.weight');
  const ligatures = () => dock.fields.control('font.ligatures', 'toggle');

  return (
    <div class={styles.panel}>
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
            <div>
              <PanelHeader label={family().label()} />
              <div class={styles.segmented}>
                <SegmentedField<FontSource>
                  adapt
                  size={'sm'}
                  value={source()}
                  onChange={setSource}
                  items={[
                    {label: t('editor.default'), value: 'default'},
                    {label: t('editor.system'), value: 'system'},
                  ]}
                />
              </div>
              <div class={styles.list}>
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
      <div class={styles.fontStyle}>
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
  const [t] = useI18n<AppLocaleEntries>();
  const dock = useDock();
  return (
    <div class={styles.phoneActions}>
      <CommandMenuButton>
        {trigger => (
          <Button
            {...trigger}
            size={'sm'}
            variant={'secondary'}
            leftIcon={<SearchIcon />}
          >
            {t('editor.searchAllOptions')}
          </Button>
        )}
      </CommandMenuButton>
      <Button
        size={'sm'}
        variant={'secondary'}
        leftIcon={<SparklesIcon />}
        disabled={!dock.stage.canFormat()}
        onClick={() => void dock.stage.format()}
      >
        {t('editor.formatShort')}
      </Button>
    </div>
  );
}

// Kept outside the panel, so that the dock can open More at a given group.
const [group, setGroup] = createSignal<GroupId>(GROUPS[0].id);
export const showMoreGroup = setGroup;

/** Frame, Window and Code, one group at a time, so the panel stays as narrow as a popover. */
function MorePanel() {
  const [t] = useI18n<AppLocaleEntries>();
  const dock = useDock();
  return (
    <div class={`${styles.panel} ${styles.more}`}>
      <div class={styles.segmented}>
        <SegmentedField
          adapt
          size={'sm'}
          value={group()}
          onChange={setGroup}
          items={GROUPS.map(({id, label}) => ({label: t(label), value: id}))}
        />
      </div>
      <section
        class={styles.group}
        aria-label={t(GROUPS.find(entry => entry.id === group())!.label)}
      >
        <Group id={group()} />
      </section>
      <Show when={dock.compact()}>
        <PhoneActions />
      </Show>
    </div>
  );
}

/** What each dock item opens: in a popover on wide windows, in the sheet on a phone. */
export const PANELS: Record<
  PanelId,
  {title: LocaleKeys<AppLocaleEntries>; Body: Component}
> = {
  themes: {title: 'frame.theme', Body: ThemesPanel},
  background: {title: 'frame.background', Body: BackgroundPanel},
  padding: {title: 'frame.padding', Body: PaddingPanel},
  language: {title: 'frame.language', Body: LanguagePanel},
  font: {title: 'frame.font', Body: FontPanel},
  more: {title: 'editor.moreOptions', Body: MorePanel},
};
