import {useI18n} from '@codeimage/locale';
import {FORMAT_LIMITS, formatting} from '@codeimage/store/editor/formatting';
import {Button, NumberField} from '@codeui/kit';
import {createEffect, createMemo} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import type {Command} from '../command-menu/commands';
import {SwitchField} from '../controls/fields';
import {SparklesIcon} from './icons';
import type {SettingSection} from './sections';
import {Segmented} from './settings-segmented';
import {settings} from './settings-state';

const numbers = ['printWidth', 'tabWidth'] as const;
const toggles = [
  'useTabs',
  'singleQuote',
  'semi',
  'bracketSpacing',
  'singleAttributePerLine',
] as const;
const commas = ['none', 'es5', 'all'] as const;

export function createFormattingSection() {
  const [t] = useI18n<AppLocaleEntries>();

  const groups = createMemo(() => [
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
      <Button size="sm" theme="secondary" onClick={formatting.reset}>
        {t('editor.restoreDefaults')}
      </Button>
    ),
    groups,
  } satisfies SettingSection;
}

export function formattingCommands(): Command[] {
  const [t] = useI18n<AppLocaleEntries>();
  const group = t('formatting.title');
  return [...numbers, ...toggles, 'trailingComma' as const].map(key => ({
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
