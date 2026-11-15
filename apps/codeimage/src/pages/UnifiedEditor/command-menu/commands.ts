import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {LanguageIconDefinition} from '@codeimage/config';
import {getEditorStore} from '@codeimage/store/editor';
import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {Component} from 'solid-js';
import type {
  Control,
  ControlId,
  EditorControlsModel,
  ThemeEntry,
} from '../model';
import type {IconProps} from '../shell/icons';
import type {ListedModel} from './listed-model';
import {isChoice, shownTheme} from './listed-model';

/** What a row shows before its text: a theme, a fill, or an icon. */
export type Leading =
  | {readonly kind: 'theme'; readonly theme: ThemeEntry}
  /** A CSS background: a colour or a gradient. */
  | {readonly kind: 'fill'; readonly value: string}
  | {readonly kind: 'icon'; readonly icon: Component<IconProps>}
  /** A language icon, loaded when the row first shows. */
  | {readonly kind: 'svg'; readonly content: LanguageIconDefinition['content']};

export interface Command {
  readonly id: string;
  /** The heading of the rows. Consecutive commands of one group share it. */
  readonly group: string;
  /** What the group belongs to, such as Frame for Padding, shown before it. */
  readonly section?: string;
  /** The name read out and searched, which says what the row changes alone. */
  readonly label: string;
  /** The text the row shows under its heading, when shorter than the label. */
  readonly value?: string;
  readonly leading?: Leading;
  /** Shown at the end of the row: the state of a switch, or a shortcut. */
  readonly note?: string;
  /** True when the command is the value in use. */
  readonly current?: boolean;
  /** Shows the command on the canvas through the model's preview session. */
  readonly preview?: () => void;
  /** Saves the command, or runs it when it has nothing to preview. */
  readonly run: () => void;
}

export interface Action {
  readonly label: string;
  readonly note?: string;
  readonly icon?: Component<IconProps>;
  readonly run: () => void;
}

const RANGE_STOPS = [0, 0.25, 0.5, 0.75, 1];

const languageIcons = new Map(
  SUPPORTED_LANGUAGES.map(language => [language.id, language.icons[0]]),
);

/** Where a command sits in the list: its own group, or the section's. */
interface Place {
  readonly section: string;
  readonly themes: ReadonlyMap<string, ThemeEntry>;
}

/** The mark before an option of a control, where the option has one to show. */
function optionLeading(
  id: ControlId,
  key: string,
  place: Place,
): Leading | undefined {
  if (id === 'editor.theme') {
    const theme = place.themes.get(key);
    return theme ? {kind: 'theme', theme} : undefined;
  }
  if (id === 'editor.language') {
    const icon = languageIcons.get(key);
    return icon ? {kind: 'svg', content: icon.content} : undefined;
  }
  return undefined;
}

/**
 * The commands of one control. A control with a list of values gets a group
 * of its own, named after it, under its section. A switch, or a control that
 * only opens where it lives, stays in the group of its section.
 */
function controlCommands(
  control: Control,
  place: Place,
  model: EditorControlsModel,
  reveal: ((id: ControlId) => void) | undefined,
): Command[] {
  const [t] = useI18n<AppLocaleEntries>();
  const label = control.label();
  const own = {group: label, section: place.section};

  if (control.kind === 'toggle') {
    const on = control.value();
    return [
      {
        group: place.section,
        id: control.id,
        label: t('editor.toggle', {label}),
        note: on ? t('editor.on') : t('editor.off'),
        preview: () => control.preview(!on),
        run: () => control.set(!on),
      },
    ];
  }

  if (isChoice(control)) {
    if (control.disabled()) return [];
    const value = control.value();
    return control.options().map(option => ({
      ...own,
      id: `${control.id}=${option.key}`,
      label: `${label}: ${option.label}`,
      value: option.label,
      leading: optionLeading(control.id, option.key, place),
      current: option.key === value,
      preview: () => control.preview(option.key),
      run: () => control.set(option.key),
    }));
  }

  if (control.kind === 'range') {
    const before = control.value();
    const stops = RANGE_STOPS.map(stop => {
      const raw = control.min + (control.max - control.min) * stop;
      return Math.round(raw / control.step) * control.step;
    });
    return stops.map(stop => ({
      ...own,
      id: `${control.id}=${stop}`,
      label: `${label}: ${stop}`,
      value: String(stop),
      current: stop === before,
      preview: () => control.preview(stop),
      run: () => control.set(stop),
    }));
  }

  if (control.kind === 'background') {
    const frame = getFrameState();
    const value = control.value();
    const fills = [
      ...control.gradients.map((fill, index) => ({
        fill,
        name: t('editor.gradient', {number: String(index + 1)}),
      })),
      ...control.colors.map(fill => ({fill, name: fill})),
    ];
    fills.unshift({
      fill: control.ambient().value,
      name: control.ambient().label,
    });
    return fills.map(({fill, name}) => ({
      ...own,
      id: `${control.id}=${fill}`,
      label: `${label}: ${name}`,
      value: name,
      leading: {kind: 'fill', value: fill},
      current: fill === value,
      preview: () => model.preview(() => frame.setBackground(fill)),
      run: () => control.set(fill),
    }));
  }

  // A number or an upload has no list of values to offer. The command shows
  // where the control lives, in a layout that can say so.
  if (!reveal) return [];
  return [
    {
      group: place.section,
      id: control.id,
      label: `${label}…`,
      run: () => reveal(control.id),
    },
  ];
}

// Controls whose values the list cannot hold all of. Their group ends with
// a row that opens the control itself.
const hasPicker = (control: Control) =>
  control.id === 'frame.aspectRatio' ||
  control.id === 'font.family' ||
  control.kind === 'range' ||
  control.kind === 'background';

/**
 * Every theme, every option of every visible control, and the actions. Call
 * it once when the menu opens: previews change the values it reads, and a
 * list that reorders under the highlight cannot be navigated.
 */
export function buildCommands(input: {
  model: EditorControlsModel;
  listed: ListedModel;
  actions: readonly Action[];
  /** Commands that are not about the image, such as the layout. They follow the actions. */
  settings: readonly Command[];
  reveal: ((id: ControlId) => void) | undefined;
}): Command[] {
  const [t] = useI18n<AppLocaleEntries>();
  const {model, listed, actions, settings, reveal} = input;
  const shown = shownTheme(model);
  const themes = new Map(model.themes().map(theme => [theme.id, theme]));
  const {animation} = getEditorStore();
  const toggleAnimation = () => {
    animation.actions.setOpen(!animation.open());
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          animation.open()
            ? '[data-animate-panel] [role="slider"][tabindex="0"]'
            : '[data-animate-toggle]',
        )
        ?.focus(),
    );
  };
  const animationGroup = t('animation.panel');

  // A section's switches first, then a group for each control with values,
  // so that the section's heading shows once.
  const sectionCommands = (section: ListedModel['sections'][number]) => {
    const place: Place = {section: section.label(), themes};
    const commands = section.controls
      .filter(control => control.visible())
      .map(control => [
        ...controlCommands(control, place, model, reveal),
        ...(reveal && hasPicker(control)
          ? [
              {
                id: `${control.id}.picker`,
                group: control.label(),
                section: place.section,
                label: `${control.label()}…`,
                run: () => reveal(control.id),
              },
            ]
          : []),
      ]);
    const own = (list: Command[]) => list.some(c => c.group !== place.section);
    return [
      ...commands.filter(list => !own(list)).flat(),
      ...commands.filter(own).flat(),
    ];
  };

  return [
    ...actions.map((action, index): Command => ({
      id: `action=${index}`,
      group: t('editor.actions'),
      label: action.label,
      note: action.note,
      leading: action.icon ? {kind: 'icon', icon: action.icon} : undefined,
      run: action.run,
    })),
    {
      id: 'animate',
      group: animationGroup,
      label: t('animation.toolbar'),
      run: toggleAnimation,
    },
    {
      id: 'animate.play',
      group: animationGroup,
      label: t('animation.shortcut.togglePlayback'),
      run: () => {
        animation.actions.setOpen(true);
        animation.actions.toggle();
      },
    },
    ...(['tab', 'title', 'tabs'] as const).map(mode => ({
      id: `animate.header.${mode}`,
      group: t('animation.header.label'),
      section: animationGroup,
      label: `${t('animation.header.label')}: ${t(`animation.header.${mode}`)}`,
      value: t(`animation.header.${mode}`),
      run: () => animation.actions.setHeader({mode}),
    })),
    ...settings,
    ...model.themes().map((theme): Command => ({
      id: `theme=${theme.id}`,
      group: t('frame.theme'),
      label: `${t('frame.theme')}: ${theme.name}`,
      value: theme.name,
      leading: {kind: 'theme', theme},
      current: theme.id === shown?.id,
      preview: theme.preview,
      run: theme.apply,
    })),
    ...listed.sections.flatMap(sectionCommands),
  ];
}

export function filterCommands(
  commands: readonly Command[],
  query: string,
): readonly Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands;
  return commands.filter(command => {
    const text =
      `${command.section ?? ''} ${command.group} ${command.label}`.toLowerCase();
    return words.every(word => text.includes(word));
  });
}
