import {useI18n} from '@codeimage/locale';
import type {Accessor, Component} from 'solid-js';
import {NewDot} from '../../../components/WhatsNew/NewDot';
import type {AppLocaleEntries} from '../../../i18n';
import type {Exporter} from './export';
import type {ExportChoice} from './export-formats';
import {
  EXPORT_FORMATS,
  exportSummary,
  savedExportChoice,
} from './export-formats';
import * as styles from './export.css';
import type {IconProps} from './icons';
import {
  AltTextIcon,
  CopyIcon,
  ExportIcon,
  ExternalIcon,
  GeneralIcon,
  HideIcon,
  ShareIcon,
  StackIcon,
} from './icons';
import {settings} from './settings-state';

export type ExportItem =
  | 'animation'
  | 'image'
  | 'copy'
  | 'tabs'
  | 'new-tab'
  | 'share'
  | 'alt'
  | 'redact'
  | 'settings';

export interface ExportAction {
  readonly id: ExportItem;
  readonly icon: Component<IconProps>;
  readonly title: Accessor<string>;
  /** One line under the title. A disabled action says why. */
  readonly description: Accessor<string>;
  readonly visible: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly run: () => void;
}

/**
 * Every export action, in display order. Image actions export with
 * `choice`, so a one-off choice reaches copy, a new tab and each tab too.
 */
export function createExportActions(
  source: {readonly exporter: Exporter},
  choice: Accessor<ExportChoice> = savedExportChoice,
): readonly ExportAction[] {
  const [t] = useI18n<AppLocaleEntries>();
  const exporter = () => source.exporter;
  const always = () => true;
  const secretsLine = () =>
    exporter().secrets() === 1
      ? t('secrets.visibleOne')
      : t('secrets.visible', {count: String(exporter().secrets())});
  return [
    {
      id: 'image',
      icon: ExportIcon,
      title: () => t('editor.download'),
      description: () =>
        t('editor.downloadHint', {summary: exportSummary(choice())}),
      visible: always,
      disabled: () => exporter().busy(),
      run: () => exporter().image(choice()),
    },
    {
      id: 'animation',
      icon: ExportIcon,
      title: () => t('animation.export.title'),
      description: () => t('animation.export.description'),
      visible: () => exporter().animation.available(),
      disabled: () => exporter().busy() || exporter().animation.busy(),
      run: () => exporter().exportAnimation(),
    },
    {
      id: 'copy',
      icon: CopyIcon,
      title: () => t('editor.copyImage'),
      description: () => t('editor.copyImageHint'),
      visible: always,
      disabled: () => !exporter().canCopy() || exporter().busy(),
      run: () => exporter().copy(choice()),
    },
    {
      id: 'tabs',
      icon: StackIcon,
      title: () => t('editor.exportEachTab'),
      description: () =>
        exporter().tabs() < 2
          ? t('editor.needsTabs')
          : t('editor.tabsHint', {
              format: EXPORT_FORMATS[choice().extension].name,
            }),
      visible: always,
      disabled: () => exporter().tabs() < 2 || exporter().busy(),
      run: () => exporter().eachTab(choice()),
    },
    {
      id: 'new-tab',
      icon: ExternalIcon,
      title: () => t('editor.openImageTab'),
      description: () => t('editor.newTabHint'),
      visible: always,
      disabled: () => exporter().busy(),
      run: () => exporter().newTab(choice()),
    },
    {
      id: 'share',
      icon: ShareIcon,
      title: () => t('editor.shareShort'),
      description: () => t('editor.shareHint'),
      visible: () => exporter().canShare(),
      disabled: () => exporter().busy(),
      run: () => exporter().share(choice()),
    },
    {
      id: 'alt',
      icon: AltTextIcon,
      title: () => t('altText.copy'),
      description: () => t('altText.hint'),
      visible: always,
      disabled: () => !exporter().canCopyAltText(),
      run: () => exporter().copyAltText(),
    },
    {
      id: 'redact',
      icon: HideIcon,
      title: () => t('secrets.redactAll'),
      description: secretsLine,
      visible: () => exporter().canRedact() && exporter().secrets() > 0,
      disabled: () => false,
      run: () => exporter().redactSecrets(),
    },
    {
      id: 'settings',
      icon: GeneralIcon,
      title: () => t('editor.exportSettings'),
      description: () => t('editor.exportSettingsHint'),
      visible: always,
      disabled: () => false,
      run: () => settings.open('export'),
    },
  ];
}

/** An action's icon on a soft tile, its title and its one line. */
export function ExportActionContent(props: {action: ExportAction}) {
  return (
    <>
      <span class={styles.actionTile} aria-hidden="true">
        <props.action.icon size={18} />
      </span>
      <span class={styles.actionText}>
        <span class={styles.actionTitle}>
          {props.action.title()}
          <NewDot at={`export:${props.action.id}`} />
        </span>
        <span class={styles.actionDescription}>
          {props.action.description()}
        </span>
      </span>
    </>
  );
}
