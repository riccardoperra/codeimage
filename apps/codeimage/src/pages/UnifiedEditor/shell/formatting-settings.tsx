import {formattingJson} from '@codeimage/store/editor/formatting-json';
import {useI18n} from '@codeimage/locale';
import {FORMAT_LIMITS, formatting} from '@codeimage/store/editor/formatting';
import {Button, NumberField} from '@codeui/kit';
import {createEffect, createMemo, createSignal, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import type {Command} from '../command-menu/commands';
import {SwitchField} from '../controls/fields';
import {SparklesIcon} from './icons';
import type {SettingSection} from './sections';
import {Segmented} from './settings-segmented';
import {settings} from './settings-state';
import {FormattingJsonEditor} from './FormattingJsonEditor';

const numbers = ['printWidth', 'tabWidth'] as const;
const toggles = [
  'useTabs',
  'singleQuote',
  'semi',
  'bracketSpacing',
  'singleAttributePerLine',
] as const;
const commas = ['none', 'es5', 'all'] as const;

function ModeChoice() {
  const [t] = useI18n<AppLocaleEntries>();
  const [failed, setFailed] = createSignal(false);
  return (
    <div>
      <Segmented
        label={t('formatting.mode')}
        value={formattingJson.mode()}
        disabled={formattingJson.busy()}
        items={[
          {label: t('formatting.controls'), value: 'controls'},
          {label: t('formatting.json'), value: 'json'},
        ]}
        onChange={value =>
          void formattingJson.setMode(value).then(ok => setFailed(!ok))
        }
      />
      <Show when={failed()}>
        <p role="status">{t('formatting.storageError')}</p>
      </Show>
    </div>
  );
}

export function createFormattingSection() {
  const [t] = useI18n<AppLocaleEntries>();

  void formattingJson.load();
  const mode = createMemo(formattingJson.mode);
  const controls = createMemo(() => [
    {
      title: t('formatting.style'),
      rows: [
        ...numbers.map(key => ({
          id: `formatting-${key}` as const,
          title: t(`formatting.${key}`),
          description: () => t(`formatting.${key}Hint`),
          small: true,
          control: () => (
            <NumberField
              size="sm"
              value={formatting.options()[key]}
              {...FORMAT_LIMITS[key]}
              ref={input =>
                createEffect(() =>
                  input?.setAttribute('aria-label', t(`formatting.${key}`)),
                )
              }
              onChange={value => {
                if (typeof value === 'number') formatting.set(key, value);
              }}
            />
          ),
        })),
        ...toggles.map(key => ({
          id: `formatting-${key}` as const,
          title: t(`formatting.${key}`),
          description: () => t(`formatting.${key}Hint`),
          small: true,
          control: () => (
            <SwitchField
              id={`settings-formatting-${key}`}
              label={t(`formatting.${key}`)}
              checked={formatting.options()[key]}
              onChange={value => formatting.set(key, value)}
            />
          ),
        })),
        {
          id: 'formatting-trailingComma' as const,
          title: t('formatting.trailingComma'),
          description: () => t('formatting.trailingCommaHint'),
          control: () => (
            <Segmented
              label={t('formatting.trailingComma')}
              value={formatting.options().trailingComma}
              onChange={value => formatting.set('trailingComma', value)}
              items={commas.map(value => ({
                value,
                label: t(`formatting.${value}`),
              }))}
            />
          ),
        },
      ],
    },
  ]);

  const groups = createMemo(() => [
    {
      title: t('formatting.mode'),
      rows: [
        {
          id: 'formatting-mode' as const,
          title: t('formatting.source'),
          description: () => t('formatting.modeHint'),
          control: () => <ModeChoice />,
        },
      ],
    },
    ...(mode() === 'json'
      ? [
          {
            title: t('formatting.json'),
            rows: [
              {
                id: 'formatting-json' as const,
                title: t('formatting.jsonConfig'),
                description: () => t('formatting.jsonHint'),
                wide: true,
                control: () => <FormattingJsonEditor />,
              },
            ],
          },
        ]
      : controls()),
  ]);

  return {
    id: 'formatting',
    get name() {
      return t('formatting.title');
    },
    icon: SparklesIcon,
    get intro() {
      return t('formatting.intro');
    },
    action: () => (
      <Show when={mode() === 'controls'}>
        <Button size="sm" theme="secondary" onClick={formatting.reset}>
          {t('editor.restoreDefaults')}
        </Button>
      </Show>
    ),
    groups,
  } satisfies SettingSection;
}

export function formattingCommands(): Command[] {
  const [t] = useI18n<AppLocaleEntries>();
  const group = t('formatting.title');
  const keys =
    formattingJson.mode() === 'json'
      ? (['source', 'jsonConfig'] as const)
      : (['source', ...numbers, ...toggles, 'trailingComma'] as const);
  return keys.map(key => ({
    id: `formatting=${key}`,
    label: t(`formatting.${key}`),
    group,
    section: t('editor.settings'),
    run: () => {
      settings.open('formatting');
      settings.setQuery(t(`formatting.${key}`));
    },
  }));
}
